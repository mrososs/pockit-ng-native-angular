import { Component, computed, inject } from '@angular/core';
import { ScrollView, Text, View } from '@ng-native/components';
import { NativeHeader, TabSafeAreaView } from '@ng-native/router';
import { DocumentViewerStore } from '../../core/services/document-viewer-store.ts';
import { VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import type { DocumentPreview } from '../../core/types/document-preview.ts';
import { DocumentCard } from '../../shared/components/document-card/document-card.ts';
import { EmptyState } from '../../shared/components/empty-state/empty-state.ts';
import { chunk } from '../../shared/utils/chunk.ts';

/**
 * The design's "Quick Access" page (screen 13): every favourite document, as the two-column grid a
 * collection's own page uses. Reached from Home's "See all", pushed on the Home tab's own stack.
 *
 * Marking a document a favourite is the document viewer's own action (Phase 9): tap a card here or
 * anywhere else in the vault to open it, and favourite it from there.
 */
@Component({
  selector: 'app-favorites',
  imports: [DocumentCard, EmptyState, NativeHeader, ScrollView, TabSafeAreaView, Text, View],
  host: { class: 'screen' },
  template: `
    <native-header title="Quick Access" />
    <tab-safe-area-view [edges]="['bottom']" class="fill">
      @if (favorites().length > 0) {
        <scroll-view class="fill" [showsVerticalScrollIndicator]="false">
          <view class="content">
            <text class="text-body-secondary subtitle">{{ subtitle() }}</text>
            <view class="grid">
              @for (row of rows(); track $index) {
                <view class="pair">
                  @for (item of row; track item.id) {
                    <view class="half">
                      <app-document-card [document]="item" (open)="openDocument($event)" />
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
      } @else {
        <app-empty-state
          icon="heart"
          title="No favourites yet"
          message="Documents you mark as a favourite will show up here."
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
    .subtitle {
      margin-bottom: var(--space-lg);
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
  `,
})
export class Favorites {
  private readonly overview = inject(VAULT_OVERVIEW);
  private readonly documentViewer = inject(DocumentViewerStore);

  protected readonly favorites = computed(() => this.overview().favorites);
  protected readonly rows = computed(() => chunk(this.favorites(), 2));
  protected readonly subtitle = computed(() => {
    const count = this.favorites().length;
    return count === 1 ? '1 favorite document' : `${count} favorite documents`;
  });

  protected openDocument(item: DocumentPreview): void {
    this.documentViewer.open(item);
  }
}
