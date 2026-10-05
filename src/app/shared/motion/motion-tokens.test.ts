import { describe, expect, test } from 'vitest';
import { motion } from '../theme/theme.ts';

describe('motion tokens', () => {
  test('name a duration for feedback, a small change and an entrance', () => {
    expect(Object.keys(motion.duration)).toEqual(['instant', 'fast', 'normal']);
  });

  test('keep every duration in the range the interaction calls for', () => {
    const { instant, fast, normal } = motion.duration;

    expect(instant).toBeGreaterThanOrEqual(80);
    expect(instant).toBeLessThanOrEqual(120);
    expect(fast).toBeGreaterThanOrEqual(140);
    expect(fast).toBeLessThanOrEqual(200);
    expect(normal).toBeGreaterThanOrEqual(220);
    expect(normal).toBeLessThanOrEqual(320);
    expect(instant).toBeLessThan(fast);
    expect(fast).toBeLessThan(normal);
  });

  test('have one default easing, a valid cubic bezier', () => {
    const [x1, y1, x2, y2] = motion.easing.standard;

    expect(motion.easing.standard).toHaveLength(4);
    // The x coordinates of a bezier easing must stay in [0, 1]; the y ones may overshoot.
    expect(x1).toBeGreaterThanOrEqual(0);
    expect(x1).toBeLessThanOrEqual(1);
    expect(x2).toBeGreaterThanOrEqual(0);
    expect(x2).toBeLessThanOrEqual(1);
    expect([y1, y2].every(Number.isFinite)).toBe(true);
  });

  test('have a spring that settles almost without a wobble', () => {
    const { stiffness, damping, mass } = motion.spring.snappy;
    // The damping ratio: one is critically damped, and a little under it overshoots by a hair.
    const ratio = damping / (2 * Math.sqrt(stiffness * mass));

    expect(ratio).toBeGreaterThanOrEqual(0.7);
    expect(ratio).toBeLessThanOrEqual(1.2);
  });

  test('keep an entrance short, and a light one lighter than the full one', () => {
    const { full, light } = motion.enter;

    expect(full.rise).toBeLessThanOrEqual(16);
    expect(full.stagger).toBeLessThanOrEqual(60);
    expect(light.rise).toBeLessThan(full.rise);
    expect(light.stagger).toBeLessThan(full.stagger);
    // Six groups: the last one starts `5 * stagger` late and then runs for `normal`. The whole
    // entrance is over in about half a second.
    expect(5 * full.stagger + motion.duration.normal).toBeLessThanOrEqual(500);
  });

  test('press subtly: a small dip, a small dim', () => {
    expect(motion.press.opacity).toBeGreaterThanOrEqual(0.88);
    expect(motion.press.opacity).toBeLessThan(1);

    for (const { scale } of Object.values(motion.press.role)) {
      expect(scale).toBeGreaterThanOrEqual(0.95);
      expect(scale).toBeLessThan(1);
    }
  });

  test('press a larger surface less than a smaller one', () => {
    const { surface, control, card } = motion.press.role;

    expect(surface.scale).toBeGreaterThan(control.scale);
    expect(control.scale).toBeGreaterThan(card.scale);
  });

  test('let only a card, a surface and the add action spring back', () => {
    const springs = Object.entries(motion.press.role)
      .filter(([, { recovery }]) => recovery === 'spring')
      .map(([role]) => role);

    expect(springs).toEqual(['card', 'surface', 'round']);
    expect(motion.press.role.control.recovery).toBe('ease');
  });
});
