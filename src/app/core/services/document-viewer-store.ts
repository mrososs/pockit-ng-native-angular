import { Injectable, inject, signal } from '@angular/core';
import { NativeNavigation } from '@ng-native/router';
import type { DocumentPreview } from '../types/document-preview.ts';
import { Sharing } from './sharing.ts';

/**
 * Where a tapped document goes (Phase 9): its own fullscreen viewer for an image, the system share
 * sheet for anything else. This app renders no PDF of its own - the share sheet is also how a
 * person reaches a PDF viewer they already have (the Phase 9 decision) - so a document card never
 * has to know which of the two its own press opens; it calls `open()` and this decides.
 *
 * Carries the opened document to the viewer screen the same way `AddDraftStore` carries a pick to
 * Review: this router's outlet does not bind a plain route param to a component input.
 */
@Injectable({ providedIn: 'root' })
export class DocumentViewerStore {
  private readonly nav = inject(NativeNavigation);
  private readonly sharing = inject(Sharing);

  private readonly state = signal<DocumentPreview | null>(null);
  readonly current = this.state.asReadonly();

  open(preview: DocumentPreview): void {
    if (preview.fileType !== 'image') {
      void this.sharing.share(preview.fileUri);
      return;
    }
    this.state.set(preview);
    void this.nav.present(['/document'], { as: 'fullScreenModal' });
  }

  /** After "Edit" (Phase 11) saves: the viewer's own displayed copy, without re-presenting. */
  replace(preview: DocumentPreview): void {
    this.state.set(preview);
  }

  clear(): void {
    this.state.set(null);
  }
}
