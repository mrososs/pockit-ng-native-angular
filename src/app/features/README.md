# features

One folder per user-facing feature. A feature owns its screens, components, services, state
(signals) and models, and exposes one thing to the rest of the app: its routes.

| Folder | Purpose | Today |
| --- | --- | --- |
| `home/` | Main dashboard: search, collections, Quick Access. | built; a tab |
| `collections/` | Every collection, and one collection's page (`/collections/:id`). | built; a tab |
| `documents/` | Create, edit, organise and delete documents. | empty |
| `document-viewer/` | Fullscreen viewer for images and documents. | empty |
| `search/` | Search across the local vault. | placeholder page, a tab |
| `favorites/` | Quick access to starred documents, reached from Home. | empty |
| `settings/` | Preferences and security. | placeholder page, a tab |

A feature with a screen has `<name>.ts` (the page) and `<name>.routes.ts` (its `Routes`, exported as
`<NAME>_ROUTES`), which `app/app.routes.ts` composes into the tabs.

A routed page:

- takes `host: { class: 'screen' }`, so its native screen paints the app background (a screen
  paints nothing by itself);
- is built from `<app-tab-screen>` if it is the first page of a tab (no native header, the large
  serif title in the content, insets handled), or declares its own `<native-header title="...">` if
  it is pushed (the header owns the top inset, so it does not wrap itself in a `<safe-area-view>`);
- reads colour, spacing, radius and type from the design system.

Collection data comes from `core/config/predefined-collections.ts` and counts from `VAULT_OVERVIEW`;
a feature never invents either.

Rules:

- A feature imports from `core` and `shared`.
- A feature does not import from another feature. Anything two features need goes to `shared` or
  `core`, or the two talk through a route.
- Folders are created empty on purpose: a feature is built in its own phase (`docs/ROADMAP.md`).
