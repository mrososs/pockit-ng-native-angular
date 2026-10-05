import { DestroyRef, afterNextRender, effect, inject } from '@angular/core';
import { Animated, Easing } from '@ng-native/components/animations';
import { Accessibility } from '@ng-native/device';
import { type EnterIntensity, motion } from '../theme/theme.ts';

const [x1, y1, x2, y2] = motion.easing.standard;
const standard = Easing.bezier(x1, y1, x2, y2);

/**
 * Points sampled along the curve for each group. React Native's native driver cannot ease an
 * interpolation (it accepts a range and nothing else), so the curve is baked into the range.
 */
const SAMPLES = 8;

/** A group's window on the timeline, mapped through the curve to `from` .. `to`. */
function along(start: number, end: number, from: number, to: number) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let step = 0; step <= SAMPLES; step++) {
    const t = step / SAMPLES;
    inputRange.push(start + (end - start) * t);
    outputRange.push(from + (to - from) * standard(t));
  }
  return { inputRange, outputRange, extrapolate: 'clamp' as const };
}

/**
 * A screen's entrance. The screen is a few logical groups (a title, a search field, a card), not
 * dozens of elements: each group fades in while rising a few points, and the next group starts a
 * little after, so the whole thing is done in about half a second and the screen is usable from the
 * first frame. It plays once, when the component is first rendered.
 *
 * ```html
 * <view [animatedStyle]="enter.group(0)">the title</view>
 * <view [animatedStyle]="enter.group(1)">the search field</view>
 * ```
 *
 * It is ONE timeline: a single value that runs from 0 to 1 over the whole entrance, with each group
 * reading its own window of it (group `n` begins `n * stagger` in and lasts `duration.normal`).
 * That makes the stagger exact, because the groups cannot drift apart: React Native runs the
 * `delay` of a separate animation on a JavaScript timer, and measured on a device that timer was
 * held up by the JavaScript thread building the screen, so the groups bunched up or arrived late.
 * Here nothing is scheduled by JavaScript after the start.
 *
 * Opacity and a translation only, on the UI thread (native driver): no JavaScript per frame, and no
 * layout. Each group is already at its starting values in the first commit, so nothing flashes at its
 * resting place before it begins. If the component is destroyed mid-way (Back during the entrance)
 * the animation is stopped. With reduced motion on, every group is simply at rest: the setting is
 * reported a moment after the first frame, and the entrance is cut short then.
 */
export class EnterMotion {
  private readonly timeline = new Animated.Value(0);
  private readonly styles: Record<string, unknown>[];
  private readonly length: number;

  constructor(groups: number, intensity: EnterIntensity) {
    const { rise, stagger } = motion.enter[intensity];
    const { normal } = motion.duration;
    this.length = normal + (groups - 1) * stagger;
    this.styles = Array.from({ length: groups }, (_, index) => {
      const start = (index * stagger) / this.length;
      const end = (index * stagger + normal) / this.length;
      return {
        opacity: this.timeline.interpolate(along(start, end, 0, 1)),
        transform: [{ translateY: this.timeline.interpolate(along(start, end, rise, 0)) }],
      };
    });
  }

  /** The animated style of one group, for `[animatedStyle]`. The same object every time. */
  group(index: number): Record<string, unknown> {
    const style = this.styles[index];
    if (style === undefined) {
      throw new Error(`enterMotion has ${this.styles.length} groups; there is no group ${index}`);
    }
    return style;
  }

  start(): void {
    Animated.timing(this.timeline, {
      toValue: 1,
      duration: this.length,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }

  /** Everything at rest, now. */
  finish(): void {
    this.timeline.stopAnimation();
    this.timeline.setValue(1);
  }

  stop(): void {
    this.timeline.stopAnimation();
  }
}

/**
 * An entrance of `groups` groups. Call it where a component's fields are initialised. It starts after
 * the first render, not in the constructor: a native-driven animation keeps time on the UI thread from
 * the moment it is started, and a screen can take a few hundred milliseconds to be built and committed
 * (the Collections tab is built the first time it is opened). Started in the constructor, the entrance
 * would be over before its first frame reached the screen. Observed on a device before this was fixed.
 * `light` is the same motion with less of it, for a screen already arriving by a native transition.
 */
export function enterMotion(groups: number, intensity: EnterIntensity = 'full'): EnterMotion {
  const accessibility = inject(Accessibility);
  const enter = new EnterMotion(groups, intensity);

  if (accessibility.reduceMotion()) {
    enter.finish();
  }
  afterNextRender(() => {
    if (!accessibility.reduceMotion()) {
      enter.start();
    }
  });
  // The setting is reported asynchronously, so it can turn out to be on after an entrance began.
  effect(() => {
    if (accessibility.reduceMotion()) {
      enter.finish();
    }
  });
  inject(DestroyRef).onDestroy(() => enter.stop());
  return enter;
}
