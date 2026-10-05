import { Component, input, output } from '@angular/core';
import { Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { enterMotion } from '../../motion/enter-motion.ts';
import { Button } from '../button/button.ts';
import { Icon, type IconName } from '../icon/icon.ts';

/**
 * What a screen shows when it has nothing to show: an icon tile, a serif title, a line of
 * explanation and, if there is something to do about it, a button. Centred in the space it is given.
 *
 * The tile takes its colour from the cascade: inside a `.collection-<id>` it is that collection's
 * accent, and anywhere else it is the neutral surface, so one component serves both.
 *
 * It arrives as ONE composition: the tile, the words and the button fade up together, not one after
 * another. It is shown on a screen that is itself arriving by a native transition, so the entrance is
 * the light one.
 */
@Component({
  selector: 'app-empty-state',
  imports: [AnimatedStyle, Button, Icon, Text, View],
  template: `
    <view class="empty" [animatedStyle]="enter.group(0)">
      @if (icon(); as name) {
        <view class="tile">
          <app-icon [name]="name" [size]="32" />
        </view>
      }
      <text accessibilityRole="header" class="text-heading title">{{ title() }}</text>
      @if (message(); as text) {
        <text class="text-lead message">{{ text }}</text>
      }
      @if (actionLabel(); as label) {
        <view class="action">
          <app-button [label]="label" (action)="action.emit()" />
        </view>
      }
    </view>
  `,
  styles: `
    :host {
      flex: 1;
    }
    .empty {
      flex: 1;
      align-items: center;
      justify-content: center;
      padding: 0 var(--space-2xl) var(--space-3xl);
    }
    .tile {
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: var(--radius-2xl);
      background-color: var(--collection-tint, var(--color-surface));
    }
    .tile app-icon {
      --icon-color: var(--collection-accent, var(--color-text-secondary));
    }
    .title {
      margin-top: var(--space-xl);
      text-align: center;
    }
    .message {
      margin-top: var(--space-sm);
      text-align: center;
    }
    .action {
      margin-top: var(--space-2xl);
    }
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly icon = input<IconName>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();

  protected readonly enter = enterMotion(1, 'light');
}
