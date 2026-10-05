import type { Routes } from '@angular/router';
import { AddSheet } from './add-sheet.ts';

/**
 * Routes of the root stack beside the tab bar, presented with `NativeNavigation.present` rather
 * than pushed: the add sheet has no native header and owns its own safe area (`docs/ARCHITECTURE.md`,
 * section 7, "Screens above the tabs").
 */
export const DOCUMENTS_ROUTES: Routes = [{ path: 'add', component: AddSheet }];
