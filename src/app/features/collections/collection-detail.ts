import { Component, computed, inject, input } from '@angular/core';
import { ScrollView, Text, View } from '@ng-native/components';
import { NativeHeader, NativeNavigation, TabSafeAreaView } from '@ng-native/router';
import { VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import type { CollectionDefinition } from '../../core/types/collection.ts';
import { AddAction } from '../../shared/components/add-action/add-action.ts';
import { DocumentCard } from '../../shared/components/document-card/document-card.ts';
import { EmptyState } from '../../shared/components/empty-state/empty-state.ts';
import { addSheetPresentation } from '../../shared/theme/theme.ts';
import { documentCountLabel } from '../../shared/utils/count-label.ts';
import { chunk } from '../../shared/utils/chunk.ts';

/**
 * One collection, pushed onto the Collections stack with the native header (its name, and the
 * platform's back button). Empty, it shows the empty state in its own accent; with documents, the
 * design's two-column grid (screen 04) and the floating add button.
 *
 * What is animated is the content only: the empty state arrives as one composition (see
 * `EmptyState`). The header, the back button and the push itself belong to the platform's native
 * stack and are not touched.
 *
 * `collection` is the route's resolved data: `collectionResolver` finds it from the `:id`, and a
 * path that names no collection never reaches this page.
 */
@Component({
  selector: 'app-collection-detail',
  imports: [AddAction, DocumentCard, EmptyState, NativeHeader, ScrollView, TabSafeAreaView, Text, View],
  host: { '[class]': 'hostClass()' },
  template: `
    <native-header [title]="collection().name" />
    <tab-safe-area-view [edges]="['bottom']" class="fill">
      @if (documents().length > 0) {
        <scroll-view class="fill" [showsVerticalScrollIndicator]="false">
          <view class="content">
            <view class="meta">
              <view class="dot"></view>
              <text class="text-caption-strong text-secondary">{{ countLabel() }}</text>
            </view>
            <view class="grid">
              @for (row of rows(); track $index) {
                <view class="pair">
                  @for (item of row; track item.id) {
                    <view class="half">
                      <app-document-card [document]="item" />
                    </view>
                  }
                  @if (row.length === 1) {
                    <view class="half"></view>
                  }
                </view>
              }
            </view>
          </view>
        </scroll-view>
        <view class="floating">
          <app-add-action (add)="openAdd()" />
        </view>
      } @else {
        <app-empty-state
          [icon]="collection().icon"
          title="No documents yet"
          message="Add important documents here so they're always easy to find."
          actionLabel="Add Document"
          (action)="openAdd()"
        />
      }
    </tab-safe-area-view>
  `,
  styles: `
    .fill {
      flex: 1;
    }
    .content {
      padding: var(--space-lg) var(--space-xl) var(--space-2xl);
    }
    .meta {
      flex-direction: row;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-lg);
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background-color: var(--collection-accent);
    }
    .grid {
      gap: var(--space-lg);
    }
    .pair {
      flex-direction: row;
      gap: var(--space-md);
    }
    .half {
      flex: 1;
    }
    .floating {
      position: absolute;
      right: var(--space-xl);
      bottom: var(--space-lg);
    }
  `,
})
export class CollectionDetail {
  private readonly nav = inject(NativeNavigation);
  private readonly overview = inject(VAULT_OVERVIEW);

  readonly collection = input.required<CollectionDefinition>();

  /** The screen paints the app background, and carries the collection's accent for what is inside. */
  protected readonly hostClass = computed(() => `screen collection-${this.collection().id}`);

  protected readonly documents = computed(
    () => this.overview().documentsByCollection[this.collection().id] ?? [],
  );
  protected readonly rows = computed(() => chunk(this.documents(), 2));
  protected readonly countLabel = computed(() => documentCountLabel(this.documents().length));

  /** The design's add sheet, as a native bottom sheet over whatever is on screen. */
  protected openAdd(): void {
    void this.nav.present(['/add'], {
      as: 'formSheet',
      presentation: {
        sheetAllowedDetents: [addSheetPresentation.detent],
        sheetGrabberVisible: true,
        sheetCornerRadius: addSheetPresentation.cornerRadius,
        sheetLargestUndimmedDetent: -1,
      },
    });
  }
}
