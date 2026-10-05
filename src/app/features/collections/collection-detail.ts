import { Component, computed, inject, input } from '@angular/core';
import { NativeHeader, NativeNavigation, TabSafeAreaView } from '@ng-native/router';
import type { CollectionDefinition } from '../../core/types/collection.ts';
import { EmptyState } from '../../shared/components/empty-state/empty-state.ts';
import { addSheetPresentation } from '../../shared/theme/theme.ts';

/**
 * One collection, pushed onto the Collections stack with the native header (its name, and the
 * platform's back button). A collection holds no documents yet, so it shows the empty state in its
 * own accent.
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
  imports: [EmptyState, NativeHeader, TabSafeAreaView],
  host: { '[class]': 'hostClass()' },
  template: `
    <native-header [title]="collection().name" />
    <tab-safe-area-view [edges]="['bottom']" class="fill">
      <app-empty-state
        [icon]="collection().icon"
        title="No documents yet"
        message="Add important documents here so they're always easy to find."
        actionLabel="Add Document"
        (action)="openAdd()"
      />
    </tab-safe-area-view>
  `,
  styles: `
    .fill {
      flex: 1;
    }
  `,
})
export class CollectionDetail {
  private readonly nav = inject(NativeNavigation);

  readonly collection = input.required<CollectionDefinition>();

  /** The screen paints the app background, and carries the collection's accent for what is inside. */
  protected readonly hostClass = computed(() => `screen collection-${this.collection().id}`);

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
