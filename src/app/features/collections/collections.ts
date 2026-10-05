import { Component, computed, inject } from '@angular/core';
import { View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { NativeNavigation } from '@ng-native/router';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import { VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import type { CollectionDefinition } from '../../core/types/collection.ts';
import { CollectionCard } from '../../shared/components/collection-card/collection-card.ts';
import { PageTitle } from '../../shared/components/page-title/page-title.ts';
import { TabScreen } from '../../shared/components/tab-screen/tab-screen.ts';
import { enterMotion } from '../../shared/motion/enter-motion.ts';
import { chunk } from '../../shared/utils/chunk.ts';

/** The order Collections arrives in: the title, the featured row, then the rest. */
const COLLECTIONS_ENTRANCE = { title: 0, featured: 1, rest: 2 } as const;

/**
 * Every collection: the first as a wide featured row, the rest two to a row. Built from the same
 * list and the same card as Home, so a collection added to the list appears on both.
 *
 * It arrives in the same language as Home (opacity and a short rise, staggered by group) but with
 * less of it: three groups and the light intensity. It is created the first time the tab is opened,
 * and plays then, once.
 */
@Component({
  selector: 'app-collections',
  imports: [AnimatedStyle, CollectionCard, PageTitle, TabScreen, View],
  host: { class: 'screen' },
  template: `
    <app-tab-screen>
      <view class="head" [animatedStyle]="enter.group(group.title)">
        <app-page-title title="Collections" [subtitle]="subtitle()" />
      </view>
      <view class="grid">
        <view [animatedStyle]="enter.group(group.featured)">
          <app-collection-card
            variant="featured"
            [collection]="featured()"
            [count]="countOf(featured())"
            (open)="openCollection($event)"
          />
        </view>
        <view class="rows" [animatedStyle]="enter.group(group.rest)">
          @for (row of restRows(); track $index) {
            <view class="pair">
              @for (collection of row; track collection.id) {
                <view class="half">
                  <app-collection-card
                    variant="secondary"
                    [collection]="collection"
                    [count]="countOf(collection)"
                    (open)="openCollection($event)"
                  />
                </view>
              }
              @if (row.length === 1) {
                <view class="half"></view>
              }
            </view>
          }
        </view>
      </view>
    </app-tab-screen>
  `,
  styles: `
    .head {
      padding-top: var(--space-xl);
    }
    .grid {
      gap: var(--space-md);
      margin-top: var(--space-lg);
    }
    .rows {
      gap: var(--space-md);
    }
    .pair {
      flex-direction: row;
      gap: var(--space-md);
    }
    .half {
      flex: 1;
    }
  `,
})
export class Collections {
  private readonly nav = inject(NativeNavigation);
  private readonly overview = inject(VAULT_OVERVIEW);

  protected readonly group = COLLECTIONS_ENTRANCE;
  protected readonly enter = enterMotion(Object.keys(COLLECTIONS_ENTRANCE).length, 'light');

  protected readonly collections = PREDEFINED_COLLECTIONS;
  protected readonly featured = computed(() => this.collections[0]!);
  protected readonly restRows = computed(() => chunk(this.collections.slice(1), 2));
  protected readonly subtitle = computed(() => {
    const total = this.collections.length;
    return `${total} ${total === 1 ? 'collection' : 'collections'}`;
  });

  protected countOf(collection: CollectionDefinition): number {
    return this.overview().counts[collection.id];
  }

  protected openCollection(collection: CollectionDefinition): void {
    void this.nav.push(['/collections', collection.id]);
  }
}
