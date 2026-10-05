import { Component, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { pressMotion } from '../../motion/press-motion.ts';

/**
 * The heading of a section of a page: "Quick Access", "Suggested collections". With `actionLabel`
 * it becomes the design's row with a link on the trailing edge ("See all"), for a section that has
 * somewhere further to go.
 */
@Component({
  selector: 'app-section-header',
  imports: [AnimatedStyle, Pressable, Text, View],
  template: `
    @if (actionLabel(); as label) {
      <view class="row">
        <text accessibilityRole="header" class="text-section-title">{{ title() }}</text>
        <pressable
          accessibilityRole="button"
          [accessibilityLabel]="label"
          (pressIn)="press.in()"
          (pressOut)="press.out()"
          (press)="action.emit()"
        >
          <view [animatedStyle]="press.style">
            <text class="text-label text-accent">{{ label }}</text>
          </view>
        </pressable>
      </view>
    } @else {
      <text accessibilityRole="header" class="text-section-title">{{ title() }}</text>
    }
  `,
  styles: `
    .row {
      flex-direction: row;
      align-items: baseline;
      justify-content: space-between;
    }
  `,
})
export class SectionHeader {
  readonly title = input.required<string>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();

  protected readonly press = pressMotion('control');
}
