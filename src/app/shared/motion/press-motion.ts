import { DestroyRef, inject } from '@angular/core';
import { Animated, Easing } from '@ng-native/components/animations';
import { Accessibility } from '@ng-native/device';
import { type PressRole, motion } from '../theme/theme.ts';

const [x1, y1, x2, y2] = motion.easing.standard;
const standard = Easing.bezier(x1, y1, x2, y2);

/**
 * The tactile response of something pressable: it dips a little and dims a little under the finger,
 * and comes back. Everything about it is a token (`motion.press`), chosen per role.
 *
 * Bind `style` to the **visual** view inside the pressable, never to the pressable itself:
 *
 * ```html
 * <pressable (pressIn)="press.in()" (pressOut)="press.out()">
 *   <view [animatedStyle]="press.style">...</view>
 * </pressable>
 * ```
 *
 * The pressable is the touch target and the accessibility element; it never moves or resizes, so
 * the dip cannot shrink the area a finger can hit. Only the picture dips.
 *
 * It runs on the UI thread (native driver), so a press costs no JavaScript per frame, and each press
 * starts from wherever the last one had got to: a quick tap-tap-tap replaces the running animation
 * instead of queueing behind it. With reduced motion on, it dims and does not dip.
 */
export class PressMotion {
  private readonly scale = new Animated.Value(1);
  private readonly opacity = new Animated.Value(1);

  readonly style = { opacity: this.opacity, transform: [{ scale: this.scale }] };

  constructor(
    /** Read at each press, so a component whose role follows an input can pass a getter. */
    private readonly role: () => PressRole,
    private readonly accessibility: Accessibility,
  ) {}

  /** The finger went down. */
  in(): void {
    const { scale } = motion.press.role[this.role()];
    const options = { duration: motion.duration.instant, easing: standard, useNativeDriver: true };
    Animated.timing(this.opacity, { ...options, toValue: motion.press.opacity }).start();
    Animated.timing(this.scale, { ...options, toValue: this.dips() ? scale : 1 }).start();
  }

  /** The finger came up, or slid off. */
  out(): void {
    const { recovery } = motion.press.role[this.role()];
    const options = { duration: motion.duration.fast, easing: standard, useNativeDriver: true };
    Animated.timing(this.opacity, { ...options, toValue: 1 }).start();
    if (recovery === 'spring' && this.dips()) {
      Animated.spring(this.scale, { ...motion.spring.snappy, toValue: 1, useNativeDriver: true }).start();
    } else {
      Animated.timing(this.scale, { ...options, toValue: 1 }).start();
    }
  }

  stop(): void {
    this.scale.stopAnimation();
    this.opacity.stopAnimation();
  }

  private dips(): boolean {
    return !this.accessibility.reduceMotion();
  }
}

/**
 * A press response for a pressable. Call it where a component's fields are initialised. The role is
 * a token name, or a function of the component's inputs for one whose role depends on them.
 */
export function pressMotion(role: PressRole | (() => PressRole)): PressMotion {
  const press = new PressMotion(typeof role === 'function' ? role : () => role, inject(Accessibility));
  inject(DestroyRef).onDestroy(() => press.stop());
  return press;
}
