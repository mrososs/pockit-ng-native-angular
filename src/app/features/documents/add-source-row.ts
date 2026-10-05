import { Component, computed, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { Icon, type IconName } from '../../shared/components/icon/icon.ts';
import { pressMotion } from '../../shared/motion/press-motion.ts';

/**
 * One row of the add sheet: an icon tile, a title and a line of explanation, and a chevron. A
 * full-width row, so it dips under the finger the way a surface does, not a card.
 */
@Component({
  selector: 'app-add-source-row',
  imports: [AnimatedStyle, Icon, Pressable, Text, View],
  template: `
    <pressable
      accessibilityRole="button"
      [accessibilityLabel]="label()"
      (pressIn)="press.in()"
      (pressOut)="press.out()"
      (press)="select.emit()"
    >
      <view class="row" [animatedStyle]="press.style">
        <view class="tile">
          <app-icon [name]="icon()" [size]="24" />
        </view>
        <view class="copy">
          <text class="text-card-heading">{{ title() }}</text>
          <text class="text-body-secondary">{{ subtitle() }}</text>
        </view>
        <app-icon name="chevron-right" [size]="18" class="chevron" />
      </view>
    </pressable>
  `,
  styles: `
    .row {
      flex-direction: row;
      align-items: center;
      gap: var(--space-md);
      height: 76px;
      padding: 0 var(--space-lg);
      border-radius: var(--radius-xl);
      background-color: var(--color-surface-elevated);
    }
    .tile {
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      background-color: var(--color-accent-tint);
    }
    .tile app-icon {
      --icon-color: var(--color-accent);
    }
    .copy {
      flex: 1;
    }
    .chevron {
      --icon-color: var(--color-text-tertiary);
    }
  `,
})
export class AddSourceRow {
  readonly icon = input.required<IconName>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly select = output<void>();

  protected readonly label = computed(() => `${this.title()}, ${this.subtitle()}`);
  protected readonly press = pressMotion('surface');
}
