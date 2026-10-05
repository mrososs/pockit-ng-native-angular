import type { Routes } from '@angular/router';
import { DocumentViewer } from './document-viewer.ts';

/**
 * A route of the root stack beside the tab bar, presented with `NativeNavigation.present` as a
 * `fullScreenModal` (`docs/ARCHITECTURE.md`, section 7, "Screens above the tabs"), the same as the
 * add sheet and Review.
 */
export const DOCUMENT_VIEWER_ROUTES: Routes = [{ path: 'document', component: DocumentViewer }];
