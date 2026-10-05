import type { Routes } from '@angular/router';
import { DocumentEdit } from './document-edit.ts';
import { DocumentViewer } from './document-viewer.ts';

/**
 * Routes of the root stack beside the tab bar, presented with `NativeNavigation.present` as a
 * `fullScreenModal` (`docs/ARCHITECTURE.md`, section 7, "Screens above the tabs"), the same as the
 * add sheet and Review. `document-edit` is `push`ed from within the viewer, the same way Review is
 * pushed from the add sheet, over it rather than under it.
 */
export const DOCUMENT_VIEWER_ROUTES: Routes = [
  { path: 'document', component: DocumentViewer },
  { path: 'document-edit', component: DocumentEdit },
];
