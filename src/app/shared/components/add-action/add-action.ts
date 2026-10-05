import { Component, input, output } from '@angular/core';
import { Pressable, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { pressMotion } from '../../motion/press-motion.ts';
import { Icon } from '../icon/icon.ts';

/**
 * The floating "add" button: a gold circle with a plus. Its parent places it. It is the one
 * element in the design that casts a shadow, and the one that springs back when released.
 */
@Component({
  selector: 'app-add-action',
  imports: [AnimatedStyle, Icon, Pressable, View],
  template: `
    <pressable
      accessibilityRole="button"
      [accessibilityLabel]="label()"
      (pressIn)="press.in()"
      (pressOut)="press.out()"
      (press)="add.emit()"
    >
      <view class="fab" [animatedStyle]="press.style">
        <app-icon name="plus" [size]="26" />
      </view>
    </pressable>
  `,
  styles: `
    .fab {
      align-items: center;
      justify-content: center;
      width: var(--size-fab);
      height: var(--size-fab);
      border-radius: var(--radius-full);
      background-color: var(--color-accent);
      box-shadow: var(--shadow-fab);
    }
    .fab app-icon {
      --icon-color: var(--color-on-accent);
    }
  `,
})
export class AddAction {
  readonly label = input('Add document');
  readonly add = output<void>();

  protected readonly press = pressMotion('round');
}
