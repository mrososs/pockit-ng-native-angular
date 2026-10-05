import type { Routes } from '@angular/router';
import { AddSheet } from './add-sheet.ts';
import { Review } from './review.ts';

/**
 * Routes of the root stack beside the tab bar, presented with `NativeNavigation.present` rather
 * than pushed: the add sheet has no native header and owns its own safe area (`docs/ARCHITECTURE.md`,
 * section 7, "Screens above the tabs"). `add-review` is `push`ed from within the add sheet once a
 * pick is copied into the vault, over it rather than under it (the same section).
 */
export const DOCUMENTS_ROUTES: Routes = [
  { path: 'add', component: AddSheet },
  { path: 'add-review', component: Review },
];
