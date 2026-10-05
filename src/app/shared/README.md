# shared

Reusable presentation primitives that belong to no single feature, and the design system they are
built on.

| Folder | Holds |
| --- | --- |
| `theme/` | The design system. `theme.ts` is the one source of truth (colour, spacing, radius, size, shadow, type, fonts). `global.css` is generated from it (`npm run theme`) and is the global stylesheet every component sees. `global-styles.ts` carries it to `mount()`. |
| `components/` | Native-element components built from `@ng-native/components`: `icon`, `button`, `search-trigger`, `page-title`, `section-header`, `collection-card`, `document-card`, `document-thumb`, `add-action`, `empty-state`, `tab-screen`. |
| `motion/` | How things move: `pressMotion()` (the press response of a pressable) and `enterMotion()` (a screen's entrance). Both read the `motion` tokens in `theme/theme.ts` and the reduced-motion setting, and run on the UI thread. A component asks for motion here and never writes a duration, a curve or a scale of its own. |
| `directives/` | Reusable directives. |
| `pipes/` | Reusable pipes. |
| `utils/` | Pure functions, with no Angular and no native dependency: `chunk`, `count-label`. |
| `models/` | Types that more than one feature needs. A type only one feature uses stays in that feature. |

Rules:

- `shared` may import from `core`, never from `features`. Move something here only once a second
  feature needs it.
- A component reads colour, spacing, radius and type from the design system and never writes one
  itself: `var(--color-text-primary)`, `class="text-body"`. Only the thumbnails' placeholder artwork
  may hold colours. `hygiene.test.ts` enforces it.
- A primitive is added with its first real use, takes its look from the system, gets
  `accessibilityRole` and a label if it can be pressed, and has a test.
- A pressable binds `(pressIn)` and `(pressOut)` to a `pressMotion()`, and puts the animated style on the view
  *inside* it: the touch target itself never moves. `hygiene.test.ts` enforces it.

See `docs/ARCHITECTURE.md`, sections 6 (design system) and 8 (motion).
