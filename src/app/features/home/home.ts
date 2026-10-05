import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Text, ScrollView, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { NativeNavigation } from '@ng-native/router';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import { DocumentViewerStore } from '../../core/services/document-viewer-store.ts';
import { VAULT_OVERVIEW, totalDocuments } from '../../core/services/vault-overview.ts';
import type { CollectionDefinition } from '../../core/types/collection.ts';
import type { DocumentPreview } from '../../core/types/document-preview.ts';
import { AddAction } from '../../shared/components/add-action/add-action.ts';
import { Button } from '../../shared/components/button/button.ts';
import { CollectionCard } from '../../shared/components/collection-card/collection-card.ts';
import { DocumentCard } from '../../shared/components/document-card/document-card.ts';
import { Icon } from '../../shared/components/icon/icon.ts';
import { PageTitle } from '../../shared/components/page-title/page-title.ts';
import { SearchTrigger } from '../../shared/components/search-trigger/search-trigger.ts';
import { SectionHeader } from '../../shared/components/section-header/section-header.ts';
import { TabScreen } from '../../shared/components/tab-screen/tab-screen.ts';
import { enterMotion } from '../../shared/motion/enter-motion.ts';
import { addSheetPresentation } from '../../shared/theme/theme.ts';
import { chunk } from '../../shared/utils/chunk.ts';

/** The order Home arrives in: an index per logical group, in the order they appear. */
const HOME_ENTRANCE = { intro: 0, search: 1, lead: 2, rest: 3, quickAccess: 4, add: 5 } as const;

/**
 * Home, in the two states the design draws.
 *
 * A vault with no documents (the real state today) shows the invitation to add the first one and
 * the collections as a list. A vault with documents shows its collections as cards with their
 * counts, the favourites as Quick Access, and the floating add button. Which one is showing is
 * read from `VAULT_OVERVIEW`, so nothing here changes when documents become real.
 *
 * Both add buttons open the add sheet. What it picks has nowhere to go yet (there is no document
 * model or storage until Phases 6 and 7), so the vault here does not change when one is used.
 */
@Component({
  selector: 'app-home',
  imports: [
    AddAction,
    AnimatedStyle,
    Button,
    CollectionCard,
    DocumentCard,
    Icon,
    PageTitle,
    ScrollView,
    SearchTrigger,
    SectionHeader,
    TabScreen,
    Text,
    View,
  ],
  host: { class: 'screen' },
  template: `
    <app-tab-screen>
      <view [animatedStyle]="enter.group(group.intro)">
        <view class="top">
          <text class="text-wordmark">Pockit</text>
          @if (hasDocuments()) {
            <view class="shield">
              <app-icon name="shield" [size]="22" />
            </view>
          }
        </view>

        <app-page-title title="Your Vault" [subtitle]="subtitle()" />
      </view>

      <view class="search" [animatedStyle]="enter.group(group.search)">
        <app-search-trigger (activate)="openSearch()" />
      </view>

      @if (hasDocuments()) {
        <view class="lead-card" [animatedStyle]="enter.group(group.lead)">
          <app-collection-card
            variant="primary"
            [collection]="featured()"
            [count]="countOf(featured())"
            [peek]="peekOf(featured())"
            (open)="openCollection($event)"
          />
        </view>
        <view [animatedStyle]="enter.group(group.rest)">
          @for (row of restRows(); track $index) {
            <view class="pair">
              @for (collection of row; track collection.id) {
                <view class="half">
                  <app-collection-card
                    variant="secondary"
                    [chevron]="true"
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

        @if (favorites().length > 0) {
          <view [animatedStyle]="enter.group(group.quickAccess)">
            <view class="section">
              <app-section-header title="Quick Access" actionLabel="See all" (action)="openFavorites()" />
            </view>
            <scroll-view
              [horizontal]="true"
              [showsHorizontalScrollIndicator]="false"
              class="quick-access"
            >
              <view class="quick-row">
                @for (favorite of favorites(); track favorite.id) {
                  <view class="quick-card">
                    <app-document-card [document]="favorite" (open)="openDocument($event)" />
                  </view>
                }
              </view>
            </scroll-view>
          </view>
        }

        <view class="fab-clearance"></view>
      } @else {
        <view class="hero collection-personal-documents" [animatedStyle]="enter.group(group.lead)">
          <view class="art">
            <view class="sheet sheet-back"></view>
            <view class="sheet sheet-front collection-certificates"></view>
            <view class="sheet sheet-add">
              <app-icon name="plus" [size]="28" />
            </view>
          </view>
          <text accessibilityRole="header" class="text-card-title hero-title">
            Add your first document
          </text>
          <text class="text-body-secondary hero-text">Photos, IDs and PDFs, saved in seconds.</text>
          <view class="hero-action">
            <app-button label="Add document" (action)="openAdd()" />
          </view>
        </view>

        <view [animatedStyle]="enter.group(group.rest)">
          <view class="section">
            <app-section-header title="Suggested collections" />
          </view>
          <view class="list">
            @for (collection of collections; track collection.id) {
              <app-collection-card
                variant="compact"
                [collection]="collection"
                (open)="openCollection($event)"
              />
            }
          </view>
        </view>
      }

      @if (hasDocuments()) {
        <app-add-action floating [animatedStyle]="enter.group(group.add)" (add)="openAdd()" />
      }
    </app-tab-screen>
  `,
  styles: `
    .top {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      height: var(--size-tap);
    }
    .shield {
      align-items: center;
      justify-content: center;
      width: var(--size-tap);
      height: var(--size-tap);
    }
    .search {
      margin-top: var(--space-lg);
    }
    .lead-card {
      margin-top: var(--space-xl);
    }
    .pair {
      flex-direction: row;
      gap: var(--space-md);
      margin-top: var(--space-md);
    }
    .half {
      flex: 1;
    }
    .section {
      margin-top: var(--space-2xl);
    }
    .list {
      gap: var(--space-sm);
      margin-top: var(--space-md);
    }

    .quick-access {
      margin: var(--space-md) calc(var(--space-xl) * -1) 0;
    }
    .quick-row {
      flex-direction: row;
      gap: var(--space-md);
      padding: 0 var(--space-xl);
    }
    .quick-card {
      width: 148px;
    }
    .fab-clearance {
      height: calc(var(--size-fab) + var(--space-xl));
    }

    .hero {
      align-items: center;
      margin-top: var(--space-xl);
      padding: var(--space-2xl) var(--space-xl);
      border-radius: var(--radius-2xl);
      background-color: var(--collection-surface);
    }
    .art {
      width: 150px;
      height: 92px;
    }
    .sheet {
      position: absolute;
      width: 104px;
      height: 70px;
      border-radius: var(--radius-md);
      background-color: var(--collection-tint);
    }
    .sheet-back {
      left: 6px;
      top: 14px;
      transform: rotate(-10deg);
    }
    .sheet-front {
      left: 40px;
      top: 6px;
      transform: rotate(8deg);
    }
    .sheet-add {
      left: 23px;
      top: 16px;
      align-items: center;
      justify-content: center;
      border: 1.5px dashed var(--color-accent-outline);
      background-color: color-mix(in srgb, var(--collection-accent) 8%, var(--collection-surface));
    }
    .sheet-add app-icon {
      --icon-color: var(--color-accent);
    }
    .hero-title {
      margin-top: var(--space-xl);
      text-align: center;
    }
    .hero-text {
      margin-top: var(--space-xs);
      text-align: center;
    }
    .hero-action {
      margin-top: var(--space-lg);
    }
  `,
})
export class Home {
  private readonly nav = inject(NativeNavigation);
  private readonly router = inject(Router);
  private readonly overview = inject(VAULT_OVERVIEW);
  private readonly documentViewer = inject(DocumentViewerStore);

  /**
   * The entrance is six logical groups, not the dozens of elements on the screen, and each is a
   * single wrapper: the title and intro, the search field, the lead (the primary card, or the
   * invitation while the vault is empty), the rest of the collections, Quick Access, and the add
   * button. A state that has no group of its own (an empty vault has no Quick Access) simply never
   * draws it. Opacity and a short rise, staggered; it plays when Home is created, once, and not
   * again when the tab is returned to.
   */
  protected readonly group = HOME_ENTRANCE;
  protected readonly enter = enterMotion(Object.keys(HOME_ENTRANCE).length, 'full');

  protected readonly collections = PREDEFINED_COLLECTIONS;
  protected readonly favorites = computed(() => this.overview().favorites);
  protected readonly hasDocuments = computed(() => totalDocuments(this.overview()) > 0);

  protected readonly subtitle = computed(() =>
    this.hasDocuments()
      ? 'Everything important, right where you need it.'
      : 'Keep important documents easy to find.',
  );

  /** The collection that gets the large card. */
  protected readonly featured = computed(() => this.collections[0]!);
  /** The others, two to a row. */
  protected readonly restRows = computed(() => chunk(this.collections.slice(1), 2));

  protected countOf(collection: CollectionDefinition): number {
    return this.overview().counts[collection.id];
  }

  protected peekOf(collection: CollectionDefinition) {
    return this.overview().peeks[collection.id] ?? [];
  }

  /** Opens the collection on the Collections tab, with the list beneath it for Back. */
  protected openCollection(collection: CollectionDefinition): void {
    void this.nav.push(['/collections', collection.id]);
  }

  protected openSearch(): void {
    void this.router.navigateByUrl('/search');
  }

  /** Quick Access's "See all": the same favourites, as the design's own page. */
  protected openFavorites(): void {
    void this.nav.push(['/home', 'favorites']);
  }

  protected openDocument(item: DocumentPreview): void {
    this.documentViewer.open(item);
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
