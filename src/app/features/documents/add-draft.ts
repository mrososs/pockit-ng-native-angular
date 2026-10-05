import { Injectable, signal } from '@angular/core';
import type { DocumentFileType } from '../../core/types/document-item.ts';

/** What the add sheet found, on its way to Review. */
export interface AddDraft {
  readonly fileUri: string;
  readonly fileType: DocumentFileType;
  readonly suggestedTitle: string;
}

/**
 * Hands a pick from the add sheet to Review. A route param would do this more in the open, but
 * `@ng-native/router`'s outlet does not bind plain route params to inputs the way
 * `withComponentInputBinding()` does for a resolver's data (`CollectionDetail`'s `collection`,
 * which this does not touch) - checked directly, not assumed. One slot is enough: only one add
 * flow is ever in progress.
 */
@Injectable({ providedIn: 'root' })
export class AddDraftStore {
  private readonly draft = signal<AddDraft | null>(null);

  readonly current = this.draft.asReadonly();

  set(draft: AddDraft): void {
    this.draft.set(draft);
  }

  clear(): void {
    this.draft.set(null);
  }
}
