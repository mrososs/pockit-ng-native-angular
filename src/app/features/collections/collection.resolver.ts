import { inject } from '@angular/core';
import { RedirectCommand, Router, type ResolveFn } from '@angular/router';
import { findCollection } from '../../core/config/predefined-collections.ts';
import type { CollectionDefinition } from '../../core/types/collection.ts';

/**
 * Finds the collection a `/collections/:id` path names. A path that names none (a stale link, a
 * mistyped id) is sent to the list of collections instead of opening a page with nothing to show,
 * which also covers a link that launches the app, where there is no Back to return to.
 */
export const collectionResolver: ResolveFn<CollectionDefinition | RedirectCommand> = (route) =>
  findCollection(route.paramMap.get('id')) ??
  new RedirectCommand(inject(Router).parseUrl('/collections'));
