import { Component } from '@angular/core';
import { SafeAreaView, ScrollView, View } from '@ng-native/components';
import { NativeHeader, TabSafeAreaView } from '@ng-native/router';

/**
 * The page of a tab's first screen: no native header (the design puts a large serif title in the
 * content instead), a scrolling body with the screen gutter, and a slot for a floating action.
 *
 * It owns the insets, so a page that uses it writes none of its own:
 * - the top, below the status bar, from `<safe-area-view>`, since there is no header to clear it;
 * - the bottom, above the tab bar, from `<tab-safe-area-view>`, which asks the tab screen what the
 *   bar covers. Do not replace that with a fixed number: the bar's height differs by device.
 *
 * A page that has a native header (a pushed screen) does not use this component: the header owns
 * the top inset, and clearing it twice would leave a gap.
 *
 * The page's own host takes `class="screen"` so the screen paints the app background.
 */
@Component({
  selector: 'app-tab-screen',
  imports: [NativeHeader, SafeAreaView, ScrollView, TabSafeAreaView, View],
  template: `
    <native-header [hidden]="true" />
    <safe-area-view [edges]="['top']" class="fill">
      <tab-safe-area-view [edges]="['bottom']" class="fill">
        <scroll-view class="fill" [showsVerticalScrollIndicator]="false">
          <view class="content">
            <ng-content />
          </view>
        </scroll-view>
        <view class="floating">
          <ng-content select="[floating]" />
        </view>
      </tab-safe-area-view>
    </safe-area-view>
  `,
  styles: `
    :host {
      flex: 1;
    }
    .fill {
      flex: 1;
    }
    .content {
      padding: 0 var(--space-xl) var(--space-2xl);
    }
    .floating {
      position: absolute;
      right: var(--space-xl);
      bottom: var(--space-lg);
    }
  `,
})
export class TabScreen {}
