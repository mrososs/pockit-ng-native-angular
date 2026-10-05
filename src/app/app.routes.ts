import type { Routes } from '@angular/router';
import { COLLECTIONS_ROUTES } from './features/collections/collections.routes.ts';
import { DOCUMENTS_ROUTES } from './features/documents/documents.routes.ts';
import { HOME_ROUTES } from './features/home/home.routes.ts';
import { SEARCH_ROUTES } from './features/search/search.routes.ts';
import { SETTINGS_ROUTES } from './features/settings/settings.routes.ts';
import { TabStack } from './shell/tab-stack.ts';
import { Tabs } from './shell/tabs.ts';

/**
 * The root stack's first screen is the tab bar. Each tab is a stack of its own (`TabStack`) that
 * holds its feature's routes, so a screen pushed from a tab keeps the bar underneath it.
 *
 * A tab's `path` must match a `<native-tab path>` in `shell/tabs.ts`; `app.test.ts` checks that.
 * The routes are not lazy: a release build puts every lazy route in the one bundle anyway, so
 * laziness only adds a pause in development. Screens that sit above the tabs, such as the document
 * viewer, are routes of the root stack beside the tab bar and are presented with `NativeNavigation`.
 */
export const routes: Routes = [
  {
    path: '',
    component: Tabs,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: TabStack, children: HOME_ROUTES },
      { path: 'collections', component: TabStack, children: COLLECTIONS_ROUTES },
      { path: 'search', component: TabStack, children: SEARCH_ROUTES },
      { path: 'settings', component: TabStack, children: SETTINGS_ROUTES },
    ],
  },
  ...DOCUMENTS_ROUTES,
];
