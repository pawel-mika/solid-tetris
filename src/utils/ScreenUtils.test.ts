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

  it('maxDrop is 1 for a single floating block over one empty', () => {
    const screen = [
      row(PixelType.TAKEN, PixelType.EMPTY),
      row(PixelType.EMPTY, PixelType.EMPTY),
    ];
    expect(ScreenUtils.calculateGravityCascadeMaxDrop(screen)).toBe(1);
  });

  it('maxDrop counts empty rows between blocks (taller gap)', () => {
    // Empty rows between taken cells — packing-before-rotate undercounts this.
    const screen = [
      row(PixelType.TAKEN, PixelType.EMPTY),
      row(PixelType.EMPTY, PixelType.EMPTY),
      row(PixelType.EMPTY, PixelType.EMPTY),
      row(PixelType.TAKEN, PixelType.EMPTY),
      row(PixelType.EMPTY, PixelType.EMPTY),
    ];
    // Bottom-up: lower X needs 1 empty below; upper X needs 3 empties below → max 3
    expect(ScreenUtils.calculateGravityCascadeMaxDrop(screen)).toBe(3);
  });
});
