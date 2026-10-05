import { Component, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { pressMotion } from '../../motion/press-motion.ts';
import { Icon } from '../icon/icon.ts';

/**
 * A search field that is not one: a button shaped like a field, which opens the real search. It
 * holds no text and takes no typing.
 */
@Component({
  selector: 'app-search-trigger',
  imports: [AnimatedStyle, Icon, Pressable, Text, View],
  template: `
    <pressable
      accessibilityRole="button"
      [accessibilityLabel]="label()"
      (pressIn)="press.in()"
      (pressOut)="press.out()"
      (press)="activate.emit()"
    >
      <view class="trigger" [animatedStyle]="press.style">
        <app-icon name="search" [size]="20" />
        <text class="text-body text-tertiary">{{ label() }}</text>
      </view>
    </pressable>
  `,
  styles: `
    .trigger {
      flex-direction: row;
      align-items: center;
      gap: var(--space-md);
      height: var(--size-control);
      padding: 0 var(--space-lg);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
    }
  `,
})
export class SearchTrigger {
  readonly label = input('Search your vault');
  readonly activate = output<void>();

  /** A wide, quiet control: it dips a little and comes back without bouncing. */
  protected readonly press = pressMotion('control');
}
