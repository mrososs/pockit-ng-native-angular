import { Component, computed, inject, signal } from '@angular/core';
import { Pressable, Text, TextInput, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { NativeNavigation } from '@ng-native/router';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import { VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import type { CollectionDefinition } from '../../core/types/collection.ts';
import type { DocumentPreview } from '../../core/types/document-preview.ts';
import { CollectionCard } from '../../shared/components/collection-card/collection-card.ts';
import { EmptyState } from '../../shared/components/empty-state/empty-state.ts';
import { Icon } from '../../shared/components/icon/icon.ts';
import { SectionHeader } from '../../shared/components/section-header/section-header.ts';
import { TabScreen } from '../../shared/components/tab-screen/tab-screen.ts';
import { pressMotion } from '../../shared/motion/press-motion.ts';
import { addSheetPresentation } from '../../shared/theme/theme.ts';
import { SearchResultRow } from './search-result-row.ts';

/**
 * The design's three search states (screens 07-09): typed live, filtered against every document's
 * title, case-insensitively - there is no search index, the vault is small enough not to need one.
 *
 * With no query it offers the built-in collections as a shortcut, in place of the design's "Recent"
 * (a search history this app does not keep) and "Try searching" chips (the design's own sample
 * terms, not real data). A result row has nowhere to go yet (the document viewer is Phase 9), so it
 * presses but does nothing, the same as a document card elsewhere in the app today.
 */
@Component({
  selector: 'app-search',
  imports: [
    AnimatedStyle,
    CollectionCard,
    EmptyState,
    Icon,
    Pressable,
    SearchResultRow,
    SectionHeader,
    TabScreen,
    Text,
    TextInput,
    View,
  ],
  host: { class: 'screen' },
  template: `
    <app-tab-screen>
      <view class="row">
        <view class="field">
          <app-icon name="search" [size]="20" />
          <text-input
            [(value)]="query"
            placeholder="Search your vault"
            returnKeyType="search"
            autoCapitalize="none"
            [autoCorrect]="false"
            class="input text-body"
          />
          @if (query().length > 0) {
            <pressable
              accessibilityRole="button"
              [accessibilityLabel]="'Clear'"
              (pressIn)="clearPress.in()"
              (pressOut)="clearPress.out()"
              (press)="query.set('')"
            >
              <view class="clear" [animatedStyle]="clearPress.style">
                <app-icon name="close" [size]="10" />
              </view>
            </pressable>
          }
        </view>
        <pressable
          accessibilityRole="button"
          [accessibilityLabel]="'Cancel'"
          (pressIn)="press.in()"
          (pressOut)="press.out()"
          (press)="cancel()"
        >
          <view [animatedStyle]="press.style">
            <text class="text-label text-accent">Cancel</text>
          </view>
        </pressable>
      </view>

      @if (!hasQuery()) {
        <view class="section">
          <app-section-header title="Browse by collection" />
        </view>
        <view class="list">
          @for (collection of collections; track collection.id) {
            <app-collection-card variant="compact" [collection]="collection" (open)="openCollection($event)" />
          }
        </view>
      } @else if (results().length > 0) {
        <text class="text-body-secondary count">{{ resultsLabel() }}</text>
        <view class="results">
          @for (item of results(); track item.id) {
            <app-search-result-row [document]="item" [collectionName]="collectionNameOf(item)" [needle]="needle()" />
          }
        </view>
      } @else {
        <app-empty-state
          icon="search"
          title="No results"
          [message]="noResultsMessage()"
          actionLabel="Add document"
          (action)="openAdd()"
        />
      }
    </app-tab-screen>
  `,
  styles: `
    .row {
      flex-direction: row;
      align-items: center;
      gap: var(--space-md);
      margin-top: var(--space-sm);
    }
    .field {
      flex: 1;
      flex-direction: row;
      align-items: center;
      gap: var(--space-md);
      height: var(--size-control);
      padding: 0 var(--space-lg);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
      border-width: 1.5px;
      border-color: var(--color-accent);
      box-sizing: border-box;
    }
    .input {
      flex: 1;
      padding: 0;
    }
    .clear {
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: var(--radius-full);
      background-color: var(--color-overlay);
    }
    .section {
      margin-top: var(--space-xl);
    }
    .list {
      gap: var(--space-sm);
      margin-top: var(--space-md);
    }
    .count {
      margin-top: var(--space-xl);
    }
    .results {
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }
  `,
})
export class Search {
  private readonly nav = inject(NativeNavigation);
  private readonly overview = inject(VAULT_OVERVIEW);

  protected readonly collections = PREDEFINED_COLLECTIONS;
  protected readonly query = signal('');

  protected readonly press = pressMotion('control');
  protected readonly clearPress = pressMotion('round');

  protected readonly hasQuery = computed(() => this.query().trim().length > 0);
  protected readonly needle = computed(() => this.query().trim().toLowerCase());

  protected readonly results = computed(() => {
    const needle = this.needle();
    if (!needle) {
      return [];
    }
    return this.overview().documents.filter((item) => item.title.toLowerCase().includes(needle));
  });

  protected readonly resultsLabel = computed(() => {
    const count = this.results().length;
    return count === 1 ? '1 result' : `${count} results`;
  });

  protected readonly noResultsMessage = computed(
    () => `Nothing in your vault matches "${this.query().trim()}". Check the spelling or add it now.`,
  );

  protected collectionNameOf(item: DocumentPreview): string {
    return this.collections.find((collection) => collection.id === item.collectionId)?.name ?? '';
  }

  /** Clears back to the initial state; Search is a tab, not a screen to leave. */
  protected cancel(): void {
    this.query.set('');
  }

  protected openCollection(collection: CollectionDefinition): void {
    void this.nav.push(['/collections', collection.id]);
  }

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
