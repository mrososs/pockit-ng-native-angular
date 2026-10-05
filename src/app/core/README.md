# core

Application-wide infrastructure. Nothing here is a screen, and nothing here knows about a feature.

| Folder | Holds |
| --- | --- |
| `config/` | App configuration. Today: `predefined-collections.ts`, the built-in collections and their stable ids. |
| `constants/` | App-wide constants. |
| `services/` | Platform services and app-wide state seams. Today: `vault-overview.ts`, the read-only view of the vault's contents that screens render (empty until the persistence phase). |
| `storage/` | The local database and key-value persistence behind one abstraction. |
| `guards/` | Route guards. None yet; the router is in place, so one is added when a route needs it. |
| `types/` | Types shared across the whole app: `collection.ts`, `document-preview.ts`. |

Rule: `core` imports from no other part of `src/app`. Features and `shared` import from it.
