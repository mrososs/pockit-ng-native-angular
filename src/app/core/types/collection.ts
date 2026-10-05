/**
 * The built-in collections. These ids are stable: routes (`/collections/:id`), the design tokens
 * (`.collection-<id>`) and, later, stored documents all refer to them, so an id is never renamed.
 */
export type CollectionId = 'personal-documents' | 'certificates' | 'important';

/** The icons a collection can wear. `shared/components/icon` draws every one of them. */
export type CollectionIconName = 'id-card' | 'award' | 'flag';

/** What a collection is called and looks like. Presentation only: it holds no documents. */
export interface CollectionDefinition {
  readonly id: CollectionId;
  readonly name: string;
  /** One line under the name, for what belongs in it. */
  readonly description: string;
  readonly icon: CollectionIconName;
}
