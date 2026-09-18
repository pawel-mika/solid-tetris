# Gravity Cascade Perk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Arcade `GRAVITY_CASCADE` so a line with that perk clears, blocks animate into gaps, newly formed lines clear with points (no new perks / no other perk effects), repeating until stable.

**Architecture:** Keep gravity math in `ScreenUtils`. Drive the chain from `TetrisBoard` with a local `isCascading` flag that freezes `mainLoop`/movement, plus a timer-based runner: clear trigger lines → frame drops → plain full-line clear + score → repeat.

**Tech Stack:** SolidJS, TypeScript, Vite; add Vitest for pure `ScreenUtils` unit tests (no test runner exists today).

**Spec:** `docs/superpowers/specs/2026-09-18-gravity-cascade-perk-design.md`

## Global Constraints

- Chain until stable (drop → clear → drop).
- Mid-cascade: award points, do not spawn Arcade perks, do not run perk special effects.
- Mid-cascade scoring: plain `getPointsForRows(diff)` only (no perk multipliers).
- Preserve perk object references during drop frames (no clone that restarts timers).
- Do not persist `isCascading` in save games.
- Commit only when the user asks (plan lists suggested commit messages; skip `git commit` unless requested).

---

## File map

| File | Responsibility |
|------|----------------|
| `src/utils/ScreenUtils.ts` | `hasPerkType`, `markFullLinesToRemove`, gravity frame/maxDrop helpers |
| `src/utils/ScreenUtils.test.ts` | Unit tests for the helpers above |
| `src/game/TetrisBoard.ts` | `isCascading`, cascade runner, `clearMarkedLines` options, input/mainLoop gates |
| `src/utils/PerkFactory.ts` | Cascade perk weight |
| `package.json` / `vite.config.ts` | Vitest script + config |

---

### Task 1: Vitest + fix `hasPerkType` + `markFullLinesToRemove`

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/utils/ScreenUtils.test.ts`
- Modify: `src/utils/ScreenUtils.ts`

**Interfaces:**
- Consumes: `PixelType`, `PerkType`, `TScreen`, `Row`
- Produces:
  - `hasPerkType(rows: Array<Row>, perkType: PerkType): boolean` — true only when a pixel perk matches
  - `markFullLinesToRemove(screen: TScreen): TScreen` — marks full lines `REMOVING`, no perk actions

- [ ] **Step 1: Add Vitest**

In `package.json` add:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Install (from repo root):

```bash
pnpm add -D vitest
```

In `vite.config.ts`, add to the exported config object:

```ts
test: {
  environment: 'node',
  include: ['src/**/*.test.ts'],
},
```

(If TypeScript complains about `test`, keep the field — Vite/Vitest merge it at runtime.)

- [ ] **Step 2: Write failing tests**

Create `src/utils/ScreenUtils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createSignal } from 'solid-js';
import { PerkType } from '../model/Perk';
import { PixelType } from '../model/Pixel';
import { Row } from '../model/Row';
import ScreenUtils from './ScreenUtils';

const stubPerk = (perkType: PerkType) => {
  const [isPaused, setPaused] = createSignal(false);
  return { perkType, timeActive: 15, isPaused, setPaused };
};

const row = (...types: PixelType[]): Row => ({
  pixels: types.map((type) => ScreenUtils.createPixel(type)),
});

describe('hasPerkType', () => {
  it('returns false when no matching perk', () => {
    const lines = [row(PixelType.TAKEN, PixelType.TAKEN)];
    lines[0].pixels[0].perk = stubPerk(PerkType.POINT_MULTIPLIER);
    expect(ScreenUtils.hasPerkType(lines, PerkType.GRAVITY_CASCADE)).toBe(false);
  });

  it('returns true when matching perk exists', () => {
    const lines = [row(PixelType.TAKEN, PixelType.TAKEN)];
    lines[0].pixels[1].perk = stubPerk(PerkType.GRAVITY_CASCADE);
    expect(ScreenUtils.hasPerkType(lines, PerkType.GRAVITY_CASCADE)).toBe(true);
  });
});

describe('markFullLinesToRemove', () => {
  it('marks only full lines and ignores perk side effects', () => {
    const screen = [
      row(PixelType.TAKEN, PixelType.EMPTY),
      row(PixelType.TAKEN, PixelType.TAKEN),
    ];
    screen[1].pixels[0].perk = stubPerk(PerkType.CLEAR_BOARD);
    ScreenUtils.markFullLinesToRemove(screen);
    expect(screen[0].pixels.every((p) => p.type === PixelType.TAKEN || p.type === PixelType.EMPTY)).toBe(true);
    expect(screen[1].pixels.every((p) => p.type === PixelType.REMOVING)).toBe(true);
    expect(screen[0].pixels.some((p) => p.type === PixelType.REMOVING)).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests — expect fail**

```bash
pnpm test
```

Expected: FAIL — `markFullLinesToRemove` missing and/or `hasPerkType` returning `true` for non-matching (current `!== null` bug).

- [ ] **Step 4: Implement**

In `ScreenUtils.ts`:

```ts
public hasPerkType(rows: Array<Row>, perkType: PerkType): boolean {
    return this.getPerkPixels(rows).some(({ perk }) => perk?.perkType === perkType);
}

public markFullLinesToRemove(screen: TScreen): TScreen {
    screen.forEach((row, rowIndex) => {
        const taken = row.pixels.filter(({ type }) => type !== PixelType.EMPTY).length;
        if (taken === row.pixels.length) {
            this.markLineToRemove(row, rowIndex);
        }
    });
    return screen;
}
```

Also remove unused imports (`createEffect`, `createRenderEffect`) if still unused, and delete the `console.log` inside `calculateGravityCascadeMaxDrop`.

- [ ] **Step 5: Run tests — expect pass**

```bash
pnpm test
```

Expected: PASS for `hasPerkType` and `markFullLinesToRemove`.

- [ ] **Step 6: Commit (only if user asked)**

```bash
git add package.json pnpm-lock.yaml vite.config.ts src/utils/ScreenUtils.ts src/utils/ScreenUtils.test.ts
git commit -m "$(cat <<'EOF'
fix: correct hasPerkType and add plain full-line mark helper

EOF
)"
```

---

### Task 2: Gravity frame helpers — tests + `frames === 0` safety

**Files:**
- Modify: `src/utils/ScreenUtils.test.ts`
- Modify: `src/utils/ScreenUtils.ts` (only if needed for clarity; frame logic already exists)

**Interfaces:**
- Consumes: `getGravityCascadeFrame(screen: TScreen): TScreen | null`
- Consumes: `calculateGravityCascadeMaxDrop(screen: TScreen): number`
- Produces: documented behavior — one row-step of column gravity per frame; `0` when already settled

- [ ] **Step 1: Add tests**

Append to `src/utils/ScreenUtils.test.ts`:

```ts
describe('gravity cascade frames', () => {
  it('drops one row per frame into gaps', () => {
    const screen = [
      row(PixelType.TAKEN, PixelType.EMPTY),
      row(PixelType.EMPTY, PixelType.EMPTY),
      row(PixelType.EMPTY, PixelType.TAKEN),
    ];
    const frame = ScreenUtils.getGravityCascadeFrame(screen);
    expect(frame).not.toBeNull();
    expect(screen[0].pixels[0].type).toBe(PixelType.EMPTY);
    expect(screen[1].pixels[0].type).toBe(PixelType.TAKEN);
    expect(screen[2].pixels[1].type).toBe(PixelType.TAKEN);
  });

  it('returns null when nothing can drop', () => {
    const screen = [
      row(PixelType.EMPTY, PixelType.EMPTY),
      row(PixelType.TAKEN, PixelType.TAKEN),
    ];
    expect(ScreenUtils.getGravityCascadeFrame(screen)).toBeNull();
    expect(ScreenUtils.calculateGravityCascadeMaxDrop(screen)).toBe(0);
  });

  it('preserves perk reference when a pixel drops', () => {
    const screen = [
      row(PixelType.TAKEN, PixelType.EMPTY),
      row(PixelType.EMPTY, PixelType.EMPTY),
    ];
    const perk = stubPerk(PerkType.POINT_MULTIPLIER);
    screen[0].pixels[0].perk = perk;
    ScreenUtils.getGravityCascadeFrame(screen);
    expect(screen[1].pixels[0].perk).toBe(perk);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: PASS (existing frame logic). If maxDrop test fails due to rotation quirks, fix `calculateGravityCascadeMaxDrop` to match “max empty cells below taken cells per column” without relying on buggy empty-row trimming — preferred rewrite:

```ts
public calculateGravityCascadeMaxDrop(screen: TScreen): number {
    if (!screen.length) return 0;
    const width = screen[0].pixels.length;
    let max = 0;
    for (let col = 0; col < width; col++) {
        let emptyBelow = 0;
        let colMax = 0;
        for (let row = screen.length - 1; row >= 0; row--) {
            const type = screen[row].pixels[col].type;
            if (type === PixelType.EMPTY) {
                emptyBelow++;
            } else {
                colMax = Math.max(colMax, emptyBelow);
            }
        }
        max = Math.max(max, colMax);
    }
    return max;
}
```

Re-run until PASS.

- [ ] **Step 3: Commit (only if user asked)**

```bash
git add src/utils/ScreenUtils.ts src/utils/ScreenUtils.test.ts
git commit -m "$(cat <<'EOF'
test: cover gravity cascade frame helpers

EOF
)"
```

---

### Task 3: `clearMarkedLines` options + cascade gate hooks

**Files:**
- Modify: `src/game/TetrisBoard.ts`

**Interfaces:**
- Produces:
  - `let isCascading = false`
  - `let cascadeTimer: number | undefined`
  - `clearMarkedLines(screen: TScreen, options?: { spawnPerk?: boolean }): TScreen`
  - Default `spawnPerk: true` for Arcade outside cascade

- [ ] **Step 1: Add flag and gate `mainLoop` / input**

Near other `let` board state:

```ts
let isCascading = false;
let cascadeTimer: number | undefined;
```

At top of `mainLoop`, after pause/game-over check:

```ts
if (isCascading) {
    return;
}
```

In `onKeyDown`, after game-over/pause guard, also:

```ts
if (isCascading && e.key.toLowerCase() !== keyBinding.pause.toLowerCase()) {
    return;
}
```

(Keep pause working.)

- [ ] **Step 2: Change `clearMarkedLines`**

Replace the Arcade branch so spawn is optional; when `spawnPerk === false`, skip multiplier:

```ts
const clearMarkedLines = (screen: TScreen, options?: { spawnPerk?: boolean }): TScreen => {
    const spawnPerk = options?.spawnPerk !== false;
    const clearedScreen = screen.filter((row) => {
        const removedPixels = row.pixels.filter(({ type }) => type === PixelType.REMOVING).length;
        return removedPixels === 0;
    });
    const diff = screen.length - clearedScreen.length;

    if (diff > 0) {
        if (spawnPerk) {
            addScore(getPointsMultiplier(TilesUtils.getFullLines(screen)) * getPointsForRows(diff));
        } else {
            addScore(getPointsForRows(diff));
        }
        const padded = [...Array<Row>(diff).fill(createRow()), ...clearedScreen];
        if (spawnPerk && gameMode().mode === EGameMode.ARCADE) {
            return drawPerkOnScreen(padded);
        }
        return padded;
    }
    return screen;
};
```

Remove the WIP comment about drawing perk from this place.

- [ ] **Step 3: Soft-pause cascade timer from `pause()`**

```ts
const pause = (isPaused: boolean = true) => {
    gameState.isPaused = isPaused;
    setGameState(gameState);
    pausePerks();
    if (isPaused && cascadeTimer !== undefined) {
        window.clearInterval(cascadeTimer);
        cascadeTimer = undefined;
        // runner must be written to resume OR finish on unpause — see Task 4
    }
};
```

Defer full pause/resume behavior of the runner to Task 4 (store phase). For this task, clearing the interval on pause is enough if Task 4 uses a single orchestrator that checks `gameState.isPaused`.

- [ ] **Step 4: Manual smoke**

```bash
pnpm exec tsc --noEmit
```

Expected: no type errors from the new signature (call sites still work with one arg).

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/game/TetrisBoard.ts
git commit -m "$(cat <<'EOF'
refactor: gate cascade mode and optional perk spawn on clear

EOF
)"
```

---

### Task 4: Cascade runner (chained drop + clear)

**Files:**
- Modify: `src/game/TetrisBoard.ts`

**Interfaces:**
- Consumes: `ScreenUtils.hasPerkType`, `markFullLinesToRemove`, `getGravityCascadeFrame`, `calculateGravityCascadeMaxDrop`
- Consumes: `clearMarkedLines(screen, { spawnPerk: false })`
- Produces: `beginGravityCascade(): void` — sets `isCascading`, runs chain until stable

- [ ] **Step 1: Replace WIP cascade block in `mainLoop`**

After `setActualScreen(getActualScreen());`, replace the broken detect/clear block with:

```ts
const fullLines = TilesUtils.getFullLines(screen);
if (fullLines.length && ScreenUtils.hasPerkType(fullLines, PerkType.GRAVITY_CASCADE)) {
    beginGravityCascade();
}
```

Do **not** clear immediately here — leave `REMOVING` pixels for the runner.

- [ ] **Step 2: Implement `beginGravityCascade` + helpers**

Remove old `startGravityCascade`. Add:

```ts
const refreshScreen = () => setActualScreen(getActualScreen());

const waitMs = (ms: number) => new Promise<void>((resolve) => {
    const started = Date.now();
    const id = window.setInterval(() => {
        if (gameState.isPaused) {
            return; // hold timer while paused
        }
        if (Date.now() - started >= ms) {
            window.clearInterval(id);
            resolve();
        }
    }, 16);
});

const animateGravityFrames = async () => {
    const frames = ScreenUtils.calculateGravityCascadeMaxDrop(screen);
    if (frames <= 0) {
        return;
    }
    const tick = Math.max(40, (GAME_TICK - 50) / frames);
    for (let i = 0; i < frames; i++) {
        const frame = ScreenUtils.getGravityCascadeFrame(screen);
        if (!frame) {
            break;
        }
        screen = frame;
        refreshScreen();
        await waitMs(tick);
    }
};

const beginGravityCascade = async () => {
    if (isCascading) {
        return;
    }
    isCascading = true;

    // Show REMOVING from markLinesToRemove, then clear trigger lines (no new perk)
    await waitMs(GAME_TICK);
    screen = clearMarkedLines(screen, { spawnPerk: false });
    refreshScreen();

    // Chain: drop → plain full clear → repeat
    for (;;) {
        await animateGravityFrames();

        const full = TilesUtils.getFullLines(screen);
        if (!full.length) {
            break;
        }

        ScreenUtils.markFullLinesToRemove(screen);
        refreshScreen();
        await waitMs(GAME_TICK);
        screen = clearMarkedLines(screen, { spawnPerk: false });
        refreshScreen();
    }

    isCascading = false;
    refreshScreen();
};
```

Wire DEV `Alt+1` to `beginGravityCascade()` (remove the debug `console.log` / old `startGravityCascade` call).

- [ ] **Step 3: Clean unused imports** in `TetrisBoard.ts` (`createRenderEffect`, unused `Signal` if any).

- [ ] **Step 4: Manual verification**

```bash
pnpm start
```

1. Arcade mode → DEV `Alt+1` on a board with floating blocks / gaps → blocks fall → full lines clear → repeats until stable → controls work again.
2. Place `GRAVITY_CASCADE` via `Alt+0` until you get that perk (or temporarily force type in cheat), clear its line → same behavior.
3. Confirm no new perk tile appears mid-chain; score increases on chain clears.
4. Confirm clearing a normal full line (no cascade perk) does **not** start cascade.

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/game/TetrisBoard.ts
git commit -m "$(cat <<'EOF'
feat: chain gravity cascade clears until board is stable

EOF
)"
```

---

### Task 5: Perk weight + leftover WIP cleanup

**Files:**
- Modify: `src/utils/PerkFactory.ts`
- Modify: `src/game/TetrisBoard.ts` / `src/utils/ScreenUtils.ts` (any leftover WIP comments, unused helpers only if unused)

**Interfaces:**
- Produces: `GRAVITY_CASCADE` probability `8`

- [ ] **Step 1: Set weight**

In `PerkFactory.ts`:

```ts
{ perkType: PerkType.GRAVITY_CASCADE, probability: 8 },
```

- [ ] **Step 2: Remove dead WIP**

- Delete unused `cloneScreen` only if nothing references it; if still useful for debugging, keep but no production call required.
- Ensure no `// something wrong here` / TMP comments remain.
- Run `pnpm test` and `pnpm exec tsc --noEmit`.

- [ ] **Step 3: Final manual pass** matching Success criteria in the spec.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/utils/PerkFactory.ts src/game/TetrisBoard.ts src/utils/ScreenUtils.ts
git commit -m "$(cat <<'EOF'
chore: tune gravity cascade perk weight and remove WIP leftovers

EOF
)"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Chain drop → clear until stable | Task 4 |
| Points, no perk spawn mid-chain | Task 3 + 4 |
| No other perk effects mid-chain | Task 1 `markFullLinesToRemove` + Task 4 |
| Fix `hasPerkType` | Task 1 |
| `isCascading` gate | Task 3 |
| `frames === 0` safe | Task 2 + 4 |
| Pause holds cascade wait | Task 4 `waitMs` |
| Weight ~8 | Task 5 |
| DEV Alt+1 | Task 4 |
| Preserve perk refs on drop | Task 2 test + existing frame mutate |

## Placeholder scan

No TBD / “implement later” steps. Commit steps are optional per Global Constraints.
