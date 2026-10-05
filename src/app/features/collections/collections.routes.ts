import type { Routes } from '@angular/router';
import { collectionResolver } from './collection.resolver.ts';
import { CollectionDetail } from './collection-detail.ts';
import { Collections } from './collections.ts';

export const COLLECTIONS_ROUTES: Routes = [
  { path: '', component: Collections },
  { path: ':id', component: CollectionDetail, resolve: { collection: collectionResolver } },
];
