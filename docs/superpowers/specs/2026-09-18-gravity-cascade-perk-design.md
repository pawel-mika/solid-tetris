# Gravity Cascade Perk — Design

Date: 2026-09-18  
Branch: `feature/gravity-cascade-perk`

## Goal

Finish the Arcade perk `GRAVITY_CASCADE`: when a full line containing this perk is cleared, blocks fall into empty spaces below (animated), then newly completed lines clear, repeating until the board is stable.

## Decisions

| Topic | Choice |
|-------|--------|
| Chain behavior | **B** — loop: drop → clear full lines → drop, until nothing moves and no full lines remain |
| Scoring / perks during chain | **B** — award points for clears; do **not** spawn new Arcade perks mid-cascade |
| Other perks mid-chain | **A** — chain clears ignore perk special effects (only gravity + plain full-line clear) |
| Implementation style | **1** — local `isCascading` flag + dedicated runner in `TetrisBoard` |

## Flow

1. Normal `mainLoop` marks lines (`markLinesToRemove`), including the cascade perk line.
2. Detect `GRAVITY_CASCADE` on full/marked lines via fixed `hasPerkType`.
3. Set `isCascading = true` (skip further mainLoop work; block movement input like full-line lockout).
4. Allow one tick’s worth of `REMOVING` presentation, then clear those lines **without** `drawPerkOnScreen`.
5. Animate column gravity frame-by-frame (`getGravityCascadeFrame`) until a frame returns no movement.
6. Mark **only** full lines as `REMOVING` with no perk actions → clear → add score (multiplier still applied if a `POINT_MULTIPLIER` pixel was on a cleared line at clear time is **out of scope for mid-chain**; mid-chain uses plain points only).
7. If drops or full lines remain possible, go to step 5; else set `isCascading = false` and resume normal play.
8. Outside cascade, Arcade continues to spawn a random perk after normal clears.

Clarification on multipliers mid-chain: per decision A, perk effects do not run mid-chain, so score uses `getPointsForRows(diff)` without perk multipliers during cascade clears.

## API / file changes

### `src/utils/ScreenUtils.ts`

- Fix `hasPerkType`: use `.some(...)` (bug: `find(...) !== null` is always true).
- Add `markFullLinesToRemove(screen)` — marks full lines as `REMOVING` only, no perk actions.
- Keep `getGravityCascadeFrame` (in-place mutate, preserve perk object references).
- Clean debug `console.log` from `calculateGravityCascadeMaxDrop`; guard callers when max frames is `0`.

### `src/game/TetrisBoard.ts`

- Local `isCascading` + optional cascade interval id.
- `mainLoop` / `onKeyDown`: no progress while cascading (pause still toggles and pauses cascade interval).
- Replace WIP `startGravityCascade` with chained runner implementing the flow above.
- `clearMarkedLines(screen, options?: { spawnPerk?: boolean })` — default `spawnPerk` true for Arcade; false during cascade.
- DEV `Alt+1` triggers the same runner.

### `src/utils/PerkFactory.ts`

- Lower `GRAVITY_CASCADE` weight from `200` to `~8`.

## Edge cases

- `frames === 0`: skip drop animation; proceed to clear/stability check.
- Active tetromino: frozen (no gravity, no controls) during cascade.
- User pause: pauses cascade interval (same idea as perk timers).
- Save/load mid-cascade: unsupported; flag is not persisted.
- Screen updates: mutate in place / reuse perk references so perk timeout animations do not restart.

## Success criteria

- Cascade runs only when a full line actually contains `GRAVITY_CASCADE`.
- Visible multi-frame drop, then line clears, chaining until stable.
- Points increase for chain clears; no new perks appear during the chain.
- After cascade, gameplay resumes normally.
- DEV `Alt+1` reproduces the effect for manual testing.

## Out of scope

- Persisting cascade state in save games.
- Activating other perk effects mid-chain.
- Rewriting the overall Arcade perk system.
