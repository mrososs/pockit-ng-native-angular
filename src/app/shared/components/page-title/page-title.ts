import { Component, input } from '@angular/core';
import { Text, View } from '@ng-native/components';

/** The large serif title at the top of a tab's page, and the line under it. */
@Component({
  selector: 'app-page-title',
  imports: [Text, View],
  template: `
    <view>
      <text accessibilityRole="header" class="text-title">{{ title() }}</text>
      @if (subtitle(); as text) {
        <text class="text-lead subtitle">{{ text }}</text>
      }
    </view>
  `,
  styles: `
    .subtitle {
      margin-top: var(--space-xs);
    }
  `,
})
export class PageTitle {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
