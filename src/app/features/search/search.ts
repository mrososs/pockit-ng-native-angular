import { Component } from '@angular/core';
import { View } from '@ng-native/components';
import { EmptyState } from '../../shared/components/empty-state/empty-state.ts';
import { PageTitle } from '../../shared/components/page-title/page-title.ts';
import { TabScreen } from '../../shared/components/tab-screen/tab-screen.ts';

/** Placeholder: the Search tab exists so Home can open it. Searching comes in its own phase. */
@Component({
  selector: 'app-search',
  imports: [EmptyState, PageTitle, TabScreen, View],
  host: { class: 'screen' },
  template: `
    <app-tab-screen>
      <view class="head">
        <app-page-title title="Search" />
      </view>
      <app-empty-state title="Nothing here yet" />
    </app-tab-screen>
  `,
  styles: `
    .head {
      padding-top: var(--space-xl);
    }
  `,
})
export class Search {}
