import { Component, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { pressMotion } from '../../motion/press-motion.ts';

/**
 * The primary button: gold, with the dark ink on it. It is the only button the design has so far;
 * a secondary or outlined one arrives with the screen that needs it.
 *
 * The pressable is the touch target and carries the role and label; the gold surface inside it is
 * what dips when pressed, so the target never changes size.
 */
@Component({
  selector: 'app-button',
  imports: [AnimatedStyle, Pressable, Text, View],
  template: `
    <pressable
      accessibilityRole="button"
      [accessibilityLabel]="label()"
      (pressIn)="press.in()"
      (pressOut)="press.out()"
      (press)="action.emit()"
    >
      <view class="button" [animatedStyle]="press.style">
        <text class="text-button">{{ label() }}</text>
      </view>
    </pressable>
  `,
  styles: `
    .button {
      align-items: center;
      justify-content: center;
      height: var(--size-control);
      padding: 0 var(--space-2xl);
      border-radius: var(--radius-lg);
      background-color: var(--color-accent);
    }
  `,
})
export class Button {
  readonly label = input.required<string>();
  readonly action = output<void>();

  protected readonly press = pressMotion('control');
}
