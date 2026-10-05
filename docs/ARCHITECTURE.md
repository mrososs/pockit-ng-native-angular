# Pockit architecture

Status: Phases 5 and 6 (gallery, camera and file picking, copied into the vault's own storage)
complete, plus the lock screen and its Settings toggle from Phase 10 (built out of turn: it needs
none of Phases 6 to 9), on top of Phase 4 (motion) and Phase 3 (the Pockit design, Home, Collections,
Collection Detail). This document
describes the structure as it is and the rules new code follows. Anything under "Not implemented yet"
is direction, not fact.

## 1. Overview

Pockit is a mobile-first personal document vault. It organises the files and images on a phone that
matter (National ID, driving licence, passport, certificates, receipts, important photos, PDFs, custom
collections) so they are found in the app instead of by digging through the gallery or the Files app.

Priorities, in order: native feel, UX and motion, local-first data, then everything else.

Stack: [Angular Native](https://ng-native.com) 0.1.2, which renders Angular components as real native
iOS and Android views through React Native's Fabric renderer, inside an Expo app. Angular 22, Expo
SDK 57, React Native 0.86, TypeScript 6, Vitest 5. Navigation is `@angular/router` driving native
stacks and tabs through `@ng-native/router` and `react-native-screens`. React is never in the render
path and there is no DOM, so this is neither a web app nor a React app.

The visual source of truth is the Claude Design project "Pockit · Mobile Design v1": a dark-first
design on graphite grounds with a single champagne-gold accent, Playfair Display for titles and Plus
Jakarta Sans for the interface. The app matches it; it does not restyle it.

## 2. Architecture philosophy

- **Feature-first.** Code is grouped by what the user does with it (collections, documents, search),
  not by what kind of file it is (components, services). A feature can be read, changed and deleted
  as one unit.
- **Layers, one direction.** `features` depend on `shared` and `core`; `shared` depends on `core`;
  `core` depends on nothing in the app. The `shell` composes features and depends on all of them.
- **Add structure when it is needed.** Folders exist ahead of their code, files do not. Nothing is
  abstracted until a second user of it exists.
- **Native first.** Prefer a native element or platform service to a custom build of the same thing.
  The tab bar, the header and the stack are the platform's own, not drawn imitations.
- **One design system, two readers.** The design is data in one file; stylesheets and native chrome
  both read it. Nothing is written twice.
- **Ng Native is the source of truth.** Where this document and the installed framework disagree,
  the framework wins. `AGENTS.md` lists the rules that are easy to get wrong.

## 3. Current folder structure

```
.
├── app.json                  Expo config: name, icons, orientation, config plugins
├── metro.config.js           withAngularNative(getDefaultConfig(...)): Angular AOT + component CSS
├── tsconfig.json             extends expo/tsconfig.base; strict; strictTemplates
├── vitest.config.mts         ngNative() plugin, a shim for font requires, and the web variant of Animated under Node
├── scripts/
│   └── generate-theme.mts    npm run theme: theme.ts -> global.css
├── assets/
│   ├── icon.png, splash-icon.png, android-icon-*.png    Expo template placeholders, referenced by app.json
│   ├── icons/                                           the design's line icons (see its README)
│   ├── fonts/                                           5 TTFs and their OFL licences
│   └── images/                                          empty for now
├── docs/
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
└── src/
    ├── main.ts               entry: registers fonts, mounts <app-root> with the global stylesheet
    └── app/
        ├── app.ts            root: safe-area insets, the root native stack, status bar
        ├── app.config.ts     providers: the native router, the look of the bars, the dev preview
        ├── app.routes.ts     root route -> tab bar -> one stack per tab -> feature routes
        ├── shell/            tabs.ts (the tab bar)  tab-stack.ts (a tab's stack)
        ├── core/
        │   ├── config/       predefined-collections.ts
        │   ├── services/     vault-overview.ts
        │   └── types/        collection.ts  document-preview.ts      (constants/ storage/ guards/ empty)
        ├── shared/
        │   ├── theme/        theme.ts  theme-css.ts  global.css  global-styles.ts
        │   ├── motion/       press-motion.ts  enter-motion.ts       (the tokens are in theme.ts)
        │   ├── components/   icon  button  search-trigger  page-title  section-header
        │   │                 collection-card  document-card  document-thumb  add-action
        │   │                 empty-state  tab-screen
        │   ├── utils/        chunk.ts  count-label.ts               (directives/ pipes/ models/ empty)
        │   └── ...
        ├── features/
        │   ├── home/         home.ts  home.routes.ts
        │   ├── collections/  collections.ts  collection-detail.ts  collection.resolver.ts  collections.routes.ts
        │   ├── search/ settings/                                    placeholder pages
        │   └── documents/ document-viewer/ favorites/               empty
        ├── preview/          preview-vault.ts   demo data, dev only
        └── testing/          render.ts  navigation.ts  tree.ts  motion.ts   test helpers
```

Leaf folders hold a `.gitkeep` until they hold code. `core`, `shared` and `features` each have a
README with the rule for that layer.

### How this differs from a web Angular app

| Web Angular | Here | Why |
| --- | --- | --- |
| `app.component.ts` | `app.ts`, class `App` | The Ng Native template and `AGENTS.md` use it, and the current Angular style guide drops the `.component` suffix. |
| `app.config.ts` is read by `bootstrapApplication` | `app.config.ts` exports an `ApplicationConfig` that `src/main.ts` hands to `mount({ providers })` | `mount()` is the bootstrap. |
| `<router-outlet>` | `<native-stack-outlet>` and `<native-tabs-outlet>` | Each route's component is created on a real native screen. |
| Lazy `loadComponent` per route | Plain `component` | A release build puts every lazy route in the one bundle, so laziness only adds a pause in development. |
| `styles.css` | `shared/theme/global.css`, passed as `globalStyles` | The one stylesheet that matches a node whichever component made it. |
| `src/assets/` | `assets/` at the repo root | `app.json` references `./assets/...` and Expo expects it there. |
| `ng build` | Metro | `npm start` bundles; `npm run typecheck` runs `ngc --noEmit`. |

## 4. Responsibility of each folder

- **`src/main.ts`**: the only place that touches `react-native` / `expo`. It registers the platform
  components, registers the fonts with `loadFonts()`, then calls `mount(rootTag, App, fabricUIManager,
  { globalStyles, processColor, conditions, tokens, resolveAssetSource, providers })`.
- **`app.ts`**: the root. Safe-area insets, the root native stack, the status bar claim. No content.
- **`app.config.ts`**: app-wide providers. The native router and the look of the native header and tab
  bar, taken from `theme.ts`; and the dev preview switch (section 9).
- **`app.routes.ts`**: the route table. It composes each feature's own routes into the tabs.
- **`shell/`**: the navigation chrome that knows about every feature: the tab bar and the stack each
  tab owns.
- **`core/`**: application-wide infrastructure with no UI: the built-in collections, the vault
  overview, app-wide types, and later configuration, storage, filesystem and guards.
- **`shared/`**: the design system (`theme/`), the presentation primitives built on it, and the pure
  helpers they need.
- **`features/<name>/`**: everything for one user-facing feature: its screens, services, signal state,
  models, and a `<name>.routes.ts` exporting its `Routes`.
- **`preview/`**, **`testing/`**: demo data for development and helpers for tests. Neither ships.

## 5. Feature boundaries

| Feature | Owns | Today |
| --- | --- | --- |
| `home` | The main dashboard: search, the collections, Quick Access. | built; a tab |
| `collections` | Every collection, and one collection's page. | built; a tab |
| `documents` | Adding, editing, organising and deleting documents. | the add sheet, all three pickers, copying into the vault; no model or save yet |
| `document-viewer` | Fullscreen native viewing of images and documents. | empty |
| `search` | Local search across the vault. | placeholder page; a tab |
| `favorites` | Quick access to starred documents. Reached from Home, not a tab of its own. | empty |
| `settings` | Preferences and security (biometrics, lock behaviour). | the lock screen and its one toggle; a tab |

Rules:

1. A feature never imports another feature. Shared need goes to `shared` or `core`; navigation between
   features goes through a route.
2. A feature never talks to SQLite, the filesystem or a picker directly. It goes through a service in
   `core`, so the storage can change without touching a screen.
3. A type used by one feature stays in that feature; it moves to `shared/models` or `core/types` when
   a second feature needs it.
4. A feature exposes one thing to the shell: its `Routes`.

## 6. Design system

Everything lives in `src/app/shared/theme/`.

### One source, two readers

```
theme.ts ──▶ theme-css.ts ──(npm run theme)──▶ global.css ──▶ GlobalStyles ──▶ mount({ globalStyles })
   │                                                                    └──▶ loadFonts()
   └──▶ app.config.ts: the native header, tab bar and status bar (values, not styles)
```

`theme.ts` holds the colours, spacing, radii, control sizes, the shadow, the font faces and the type
scale. Stylesheets read the generated `global.css`: tokens as custom properties on `:root`, the type
scale and a class per collection as global classes, the font faces as `@font-face`. The native bars
cannot read the cascade, so `app.config.ts` imports values from `theme.ts` directly. There is no
second copy to drift. `theme.test.ts` fails if `global.css` is out of date, so a change is: edit
`theme.ts`, run `npm run theme`, commit both. (The generator runs under Node 22.18 or newer, which
strips the types itself.)

The sheet is global because that is the one stylesheet Ng Native matches against every node, so no
component imports a type or token file. It is carried by `GlobalStyles`, a component that is never
rendered: the compiler attaches a component's compiled sheet to its class and `styleSheetOf()` hands
it over.

### Colour

Roles, named for what they are for: `background`, `surface`, `surfaceElevated`, `chrome` (the tab bar),
`divider`; `textPrimary`, `textSecondary`, `textTertiary`; `accent`, `onAccent`, `accentOutline`;
`success`, `warning`, `danger`; `favorite`, `overlay`. In CSS they are `--color-<kebab-name>`.

Collections have their own accent: `collectionPalette` maps each `CollectionId` to an `accent` and,
where the design gives one, a `surface`. The type forces an entry for every id. For each, the sheet
has a class `.collection-<id>` that sets `--collection-accent`, `--collection-tint` (the accent at
16%) and `--collection-surface`. Put the class on an element and everything inside reads that
collection's colours through the cascade. A card, a page, an empty state and an icon all do, and none
of them names a colour.

### Spacing, radius, size, elevation

- **Spacing** `xs sm md lg xl 2xl 3xl` = 4 8 12 16 20 24 32. The screen gutter is `xl`, the gap between
  cards `md`, between sections `2xl`.
- **Radius** `sm md lg xl 2xl full` = 8 12 16 20 24 pill. The design's cards are `2xl` (large), `xl`
  (secondary) and `lg` (compact, fields, buttons).
- **Size** `tap 44`, `control 52` (a field or a button), `fab 56`.
- **Shadow**: only `fab`. The rest of the design's depth is surface contrast, so nothing else casts one.

### Type

| Class | Face | Spec |
| --- | --- | --- |
| `text-display` | Playfair 500 | 40 / 46 |
| `text-title` | Playfair 500 | 34 / 40, a tab's page title |
| `text-heading` | Playfair 500 | 24 / 30, an empty state |
| `text-card-title` | Playfair 500 | 22 / 28, the large card |
| `text-row-title` | Playfair 500 | 20 / 26, the featured row |
| `text-wordmark` | Playfair 600 italic | 20 / 24, accent |
| `text-section-title` | Jakarta 600 | 20 / 26 |
| `text-card-heading` | Jakarta 600 | 16 / 20 |
| `text-label` | Jakarta 600 | 15 / 20 |
| `text-item-title` | Jakarta 600 | 14 / 20 |
| `text-body` | Jakarta 400 | 16 / 24 |
| `text-body-secondary` | Jakarta 400 | 14 / 20, secondary |
| `text-lead` | Jakarta 400 | 15 / 22, secondary, under a title |
| `text-caption` | Jakarta 400 | 12 / 16, tertiary |
| `text-caption-strong` | Jakarta 600 | 12 / 16 |
| `text-button` | Jakarta 700 | 16 / 20, on the accent |
| `text-badge` | Jakarta 700 | 10 / 20, spaced |
| `text-eyebrow` | Jakarta 700 | 12 / 16, spaced, tertiary; a Settings group's heading |

`theme.ts` is the authority; this table is a reading aid. Three modifiers change the colour of any
of them: `text-tertiary`, `text-secondary`, and `text-collection` (the accent of the collection the
text sits in). Only modifiers a screen uses exist; add one with its first use.

The design uses a few sizes more than its published scale (13 and 15 point variants of captions and
labels). They are normalised to the nearest scale step, because a screen should not carry a size the
system does not: counts are 12, a compact card's title is 16.

### Fonts

The design depends on two faces, both open-licence (SIL OFL, licences in `assets/fonts`): Plus Jakarta
Sans 400, 600, 700 and Playfair Display 500 and 600 italic. They are bundled as static TTFs, one file per
weight, because native finds a face by name. `@font-face` in `global.css` declares them and
`loadFonts()` registers them before the first frame, so no text is laid out in a fallback face and then
again. A font that fails to load is logged and the app starts in the system face. This is why the app
depends on `expo-font` and `@ng-native/expo`: React Native cannot load a custom font without them.

**There is no weight matching in Ng Native 0.1.2**, whatever its documentation says. A rule of
`font-family: 'Plus Jakarta Sans'; font-weight: 600` reaches native with the plain family and a weight,
which Android draws as the regular face (and fakes a bold from 700). It showed on the first run on a
device: the 600-weight text was regular. So every type class names the weight-specific family that the
face is registered under, `font-family: 'Plus Jakarta Sans-600'`, and writes no `font-weight` or
`font-style` (the italic is a file of its own). The native header and tab bar are given the same names.
`theme.test.ts` checks every class names a face the compiled sheet registers, and that no class sets a
weight. If a later Ng Native does match weights, the names in `nativeFontName()` are the one place to change.

### Icons

The design's icons are SVG paths on a 24 grid. They were rasterised from that geometry into
white-on-transparent masks (`assets/icons`, see its README for the source paths) and the app tints
them, so one asset serves every colour. `<app-icon name size>` draws one; its colour is `--icon-color`,
which a parent sets, so an icon inside a collection card takes the collection's accent with no code.
The iOS tab bar draws SF Symbols instead, the closest to each glyph; the Android tab bar draws the
design's own. No icon package was added.

### Components

| Component | What it is | Used by |
| --- | --- | --- |
| `app-icon` | one of the design's icons, tinted by the cascade | everything |
| `app-button` | the primary gold button; the only one the design needs so far | empty state, Home, the lock screen |
| `app-search-trigger` | a button shaped like the search field; opens Search | Home |
| `app-page-title` | the large serif title and the line under it | Home, Collections, placeholders |
| `app-section-header` | a section heading, with the header role | Home |
| `app-collection-card` | a collection as `primary`, `featured`, `secondary` or `compact` | Home, Collections |
| `app-document-card`, `app-document-thumb` | a document in a row, and its placeholder artwork | Home (Quick Access) |
| `app-add-action` | the floating add button | Home |
| `app-empty-state` | icon tile, serif title, line, optional button | Collection page, placeholders |
| `app-tab-screen` | the first page of a tab: no header, scrolling body, insets, a floating slot | Home, Collections, placeholders |

The four forms of `collection-card` are the four the design draws, and no others. Heights, radii and
surfaces are the design's: primary 156, featured 96, secondary 112 and compact 64, on the collection's
own surface or the neutral one.

Rules for a primitive: it is added with its first real use; it reads the system and writes no colour;
a pressable one has `accessibilityRole` and a label; it has a test. The thumbnails' redacted artwork is
the one exception to "no colour in a component", since it is placeholder art and not interface; real
thumbnails replace it.

Every pressable primitive dips and dims under the finger and springs (or eases) back, through
`pressMotion()`; the touch target itself never moves. Section 8 has the rules and the numbers.

### Native bars

| Design | Where it is set | Note |
| --- | --- | --- |
| Header title, 17 Jakarta 600; back chevron in the primary text colour | `withHeaderDefaults` in `app.config.ts` | `backButtonDisplayMode: 'minimal'` |
| iOS tab bar: surface, hairline above it, label 11 Jakarta 600, accent when selected and tertiary otherwise | `withTabDefaults` in `app.config.ts`, the iOS-shaped `stacked` appearance | |
| Android tab bar: the same, plus no indicator pill and a label under every tab | `shell/android-tab-appearance.ts`, bound per tab in `shell/tabs.ts` | Android reads a flat shape that Ng Native's types do not describe; see below |
| Light status bar content | `StatusBar` claim in `app.ts` | dark UI |

The Android tab styling is its own shape because Android's tab screen reads `normal` and `selected` at
the top of the appearance object, not under iOS's `stacked`, and options iOS has no equivalent of
(`tabBarItemActiveIndicatorEnabled`, `tabBarItemLabelVisibilityMode`). The first build nested the
Android colours the iOS way and Android ignored them: grey icons, a pale pill behind the selected one,
and a label only on that tab. Ng Native converts colours only on the iOS paths, and a raw hex string
reaching Android native crashes, so `Tabs` injects the engine and converts each colour with its own
`color()` before handing the object over. `tabs.android.test.ts` holds the shape.

### Where native differs from the design

| Design | Native | What the app does |
| --- | --- | --- |
| Circular back and "more" buttons and a centred title on a collection's and Favorites' pages | The platform header: a back arrow, and a title left-aligned on Android | The native header, styled with the design's colours and font. No custom header is built. The "more" button waits for a menu to put behind it. |
| A hairline above the tab bar | Android's bottom navigation has no such prop | Drawn on iOS (`tabBarShadowColor`); absent on Android. |
| A dashed outline on the "add" tile in the first-run hero | Android draws a dashed border solid | `border-style: dashed` is set and iOS honours it; Android shows the outline solid. Intent kept. |
| iOS tab icons as the design's glyphs | iOS tab icons are SF Symbols by default | SF Symbols, the closest to each glyph (`house`, `square.stack.3d.up`, `magnifyingglass`, `slider.horizontal.3`). Android uses the design's own glyphs. Not checked on iOS. |
| 390-point frames with fixed card heights | Phones from 360 dp up | Card heights are minimums, so a card grows when its title wraps or the system font is larger; the primary card's text wraps before it reaches the thumbnails. |
| Six collections, a "New collection" tile and a header "+" on Collections | Custom collections are not in scope | The three built-in collections only, and no tile or button that does nothing. They come with the feature. |
| Search's "Recent" (a search history) and "Try searching" (sample terms) | Neither is real data: this app keeps no search history, and the terms are the design's own demo content | The built-in collections instead, as a browse-by shortcut, reusing `CollectionCard`'s `compact` row. |
| Press: scale 0.97 with a spring, and a light haptic | Motion is built; haptics need a native module | Scale and fade with a spring or an ease, per role (section 8). No haptic yet: it comes with `expo-haptics`. |
| A document viewer that renders PDFs in the app, with page dots for a multi-page one | No document has ever been tested as a PDF; Android's `WebView` cannot render one without another dependency; no document has a second page (Phase 7's shape holds one file) | A PDF opens the system share sheet instead (the user's own choice, Phase 9); the page dots are not built, since nothing ever has two pages to count. |
| "Thumbnail expands to viewer, 320ms" (a shared-element transition) | `@ng-native/router` presents a new screen; it does not morph one view already on screen into another | The platform's own `fullScreenModal` transition (a slide up). The swipe-down *close* gesture, which the platform does not give a plain `fullScreenModal` either, is this screen's own (section 8). |

### What was checked, and how

On a Pixel 7 emulator (Android, API 36) running the app in Expo Go, against the design rendered in a
browser from the same Claude Design file, side by side: Home in its empty and filled-in states,
Collections, and a collection's empty page; tab switching; opening a collection from Home and from
Collections; Back (the system button) from a collection; the search field switching to the Search tab;
scrolling; and the same screens on a 360 x 760 dp display. Not checked: iOS (no device or simulator
here, so iOS is covered by the automated tests and a cold iOS bundle only), and a tablet or foldable.
Automated tests prove structure and resolved styles, not how a native control draws; where the two
disagreed the device won (the font weights, the Android tab bar and the narrow-screen title all passed
every test before the device showed them wrong). Phase 4's motion was checked the same way, below.

**Motion, on the same Pixel 7 emulator** (Android API 36, a screen recording read frame by frame, and again
on a 360 x 760 dp display): the cold-launch Home entrance, with documents and without; the first visit to
Collections; the push of a collection's page and Back at once, mid-entrance; a held press on the tiles and
rows; tab switching and presses in quick succession (six tab taps, ten taps on the add button, eight on a
card, Back during an entrance), after which every screen was at rest; and "reduced motion", which the
emulator turns on when its animation scales are set to zero (Collections then appears at rest in its first
frame). `dumpsys gfxinfo` over a run of tab switches and presses: 755 frames, 6.75 % janky, no missed vsync.
The emulator draws in software, so the frame times (a median of about 31 ms) say nothing about a phone;
what they do say is that the motion costs no JavaScript per frame. Seen: a staggered fade and rise of the
groups; a held tile, row or button smaller by a few per cent and dimmer, in place; the empty state's tile,
words and button arriving together under a static native header.

What the recordings also showed, so a reader does not take the motion for more than it is: on a cold
launch, and on the first visit to a tab, the screen takes a couple of hundred milliseconds to appear, and the
first of those are not seen (the entrance starts when the first render is done, and the views reach the screen
a little after), so the first group is often already in place when the screen first shows and the stagger
is seen from its middle. Starting it from the first native layout event would close the gap; it was not done
because the entrance would then depend on an event the Node tests cannot raise. Separately, on a first visit
to Collections one frame in about two draws the content a status bar's height too high before it settles.
It moves every group together (so it is layout, not the motion), and comes from the native top safe-area
inset (`<safe-area-view [edges]="['top']">` in `tab-screen`, unchanged in Phase 4) arriving a frame after
a freshly built tab's first layout. It was not seen on the Search and Settings placeholders in a single
sample each and was not checked against the Phase 3 build; it is a Phase 2 inset question, left open.

**Phase 5, on the same Pixel 7 emulator:** opening the add sheet from Home's invitation; Photos
launching the real Android system photo picker (empty, since a fresh emulator has no photos) and
Cancel there returning to the sheet, still open; Camera asking for the permission, launching the
real system camera, and a confirmed capture closing the sheet back to Home unchanged; the sheet's
own Cancel row closing it the same way. Not checked: a granted library, a refused permission with
`canAskAgain` false, and iOS (no simulator here).

**Phase 6, on the same emulator:** the add sheet's Files row launching the real Android document
picker; a real file (pushed onto the device for the test) picked, copied by `VaultFiles` into the
app's own document directory through the real `expo-file-system`, and the sheet closing cleanly
with nothing in the log. This is also where a real device caught two things no test could: Metro
would not bundle at all until `@react-native-async-storage/async-storage` was installed alongside
`expo-file-system` (section 11), and `adb reverse tcp:8081` has to be redone after the emulator
restarts, or Expo Go mistakes a plain connection failure for a signal to fetch a published update,
and fails with an unrelated `Failed to download remote update`. Not checked: iOS.

**Phase 7, on the same emulator:** Camera capturing a photo, copied into the vault, Review showing
the thumbnail with an empty name field (a capture's generated filename is not suggested as a title),
a typed name and "Save to Pockit" returning to Home with Personal Documents now reading "1 document"
instead of empty. This is also where the emulator's own first-boot "Try out your stylus" tutorial
surfaced: it steals focus and typed text from whatever field is under it, is not dismissed by a
single tap on its own buttons, and recurs on every new text field focus until the device setting
that shows it (`stylus_handwriting_enabled`) is turned off, after which it does not return. Not
checked: iOS.

**Phase 8 and Phase 9 are not yet device-checked.** The emulator and Metro were stopped by the
harness's own memory-pressure guard before Phase 8's screens were built, and were not restarted for
either phase; each phase's own "Choices made" section in `ROADMAP.md` has what the next pass should
look at - Phase 9's in particular, since its gestures are the first thing in the app a device can
show that a Node test cannot: how a pinch and a swipe-down's spring actually feel.

**Phase 10's lock, on the same emulator, with nothing enrolled:** the Settings row correctly reads
`Biometrics.available()` as false and disables the switch with the explanatory line, rather than
letting the lock be turned on with no way to pass it. The lock and unlock cycle itself (backgrounding
re-locking, a passed or failed prompt, "Use passcode") is covered end to end in tests with `AppState`
and `Biometrics` faked, including the bug a device test caught: the first build tore down and rebuilt
`<native-stack-outlet>` for the lock screen, which does not resume navigation (section 7 has the fix).
Not checked: a real fingerprint or face, a real `canAskAgain: false`, and iOS.

### Contrast

Text meets WCAG AA (4.5:1) on every surface it sits on, except the design's own **tertiary** text
(`#6B7274`, used for captions, placeholders and the idle tab labels), which measures about 3.6:1 on the
ground and 3.2:1 on a card. It is kept as designed. `theme.test.ts` holds it to a floor of 3:1 and
fails if it drops further; whether to lighten it is a design decision.

### Theme

Dark only. `app.json` fixes the interface style. A light theme is a second palette block with the same
names, a second set of values in `theme.ts`, and the status bar claim set to `'auto'`.

## 7. Navigation

```
<native-stack-outlet>                  root stack, in App
 └─ Tabs                               the tab bar (header hidden)
     ├─ home         -> TabStack -> Home
     ├─ collections  -> TabStack -> Collections, and /collections/:id -> CollectionDetail
     ├─ search       -> TabStack -> Search (placeholder)
     └─ settings     -> TabStack -> Settings (placeholder)
```

Every tab is a native stack of its own (`TabStack`), so a screen pushed from a tab gets the native
header and the back gesture and leaves the bar in place, and each tab keeps its own history.

- **First pages and pushed pages.** A tab's first page has no native header: the design puts a large
  serif title in the content, so `<app-tab-screen>` hides the header and owns the insets. A pushed page
  (`CollectionDetail`) shows the native header with its title and the platform's back button.
- **Insets.** The status bar's comes from `<safe-area-view [edges]="['top']">`, only where there is no
  native header, since a header owns the top and clearing it twice leaves a gap. The tab bar's comes from
  `<tab-safe-area-view>`, which asks the tab screen what the bar covers; it is never a fixed number.
  The floating add button sits inside that inset, above the bar.
- **Opening a collection.** From Home or Collections a card calls `NativeNavigation.push(['/collections',
  id])`. From Home that selects the Collections tab and pushes the page onto its stack with the list
  beneath it, so Back returns to the list.
- **An unknown collection.** `collectionResolver` returns a `RedirectCommand` to `/collections` for an id
  that names nothing, so a stale or mistyped link lands on the list instead of an empty page, and a link
  that launches the app (which has no Back) still lands somewhere sensible.
- **Search.** Home's search field calls `Router.navigateByUrl('/search')`, which selects the tab. The
  Search page is a placeholder.
- **Adding a tab.** (1) Create the feature's `<name>.routes.ts`. (2) Add a route under `Tabs` in
  `app.routes.ts` with `component: TabStack` and `children: <NAME>_ROUTES`. (3) Add an entry to `TABS`
  in `shell/tabs.ts`: path, title, an SF Symbol, and a PNG for Android. (4) Add the path to `TAB_PATHS`
  in `app.test.ts`. The test fails if a tab and a route do not match.
- **Screens above the tabs** (the document viewer, sheets): routes of the root stack beside `Tabs`,
  shown with `NativeNavigation.present()`. A presented screen has no native header and no automatic
  insets, so it brings its own close button and `<safe-area-view>`. The add sheet (`/add`, Phase 5) is
  the first of these: a native `formSheet` (`sheetAllowedDetents`, `sheetGrabberVisible`,
  `sheetCornerRadius` on the presentation, from `addSheetPresentation` in `theme.ts`) rather than a
  hand-built overlay, so the scrim, the rounded card and the drag-to-dismiss are the platform's. Its
  own Cancel row, and a successful pick, both close it the same way: `inject(Location).back()`, which
  the platform's own swipe-to-dismiss reaches the router through too (`native-platform-location.ts`).
- **Android back.** It pops the stack of the tab in front; at that stack's root it goes to the first
  tab; on the first tab it leaves the app.
- **Deep links.** The scheme is `pockit://`. Any app on the device can open any route with any
  parameters, so a route must never delete or reveal something just by being opened: an action needs
  the person's confirmation on the page, or a guard. `withLinkParent` is not set yet; without it a link
  opens its page alone, with no Back.

## 8. Motion architecture

Motion in Pockit is calm on purpose: a person should feel an interaction more than notice it. It is
tactile feedback on what is pressed and a short, orderly arrival of what is new, and nothing else. The
platform keeps the motion it already does well (pushing a screen, popping it, switching a tab, the
back gesture); the app adds none of its own to those.

### The tools, and when to reach for each

Audited against Ng Native 0.1.2 before anything was written. Pick the simplest one that is correct,
and no further.

| Level | Tool | Runs on | Use it for | In Pockit |
| --- | --- | --- | --- | --- |
| 0 | Native navigation: stack push and pop, tab switch, the back gesture, the header | the platform | Every transition between screens | Untouched. Nothing wraps, replaces or re-times it. |
| 1 | CSS in a component's `styles`: `transition`, `@keyframes`, `animation-timeline: scroll()` | `transition` and `@keyframes`: JavaScript, one commit per frame. `scroll()` timelines: the UI thread | A one-off state change that is not a hot path (a colour, a toggle). A scroll-linked fade or move, which is declarative and native | Not used. The Phase 3 `:active` transition was removed: a CSS transition is driven from JavaScript here, which is the wrong cost for something under a finger. |
| 2 | `Animated` through `AnimatedStyle` with `useNativeDriver: true` (`@ng-native/components/animations`) | the UI thread; JavaScript only starts it | Press feedback, an entrance, anything that is a timed or spring value on `opacity` or `transform` | **All of Phase 4.** |
| 3 | Reanimated worklets (`sharedValue`, `workletStyle`, `workletScroll`) and Gesture Handler | the UI thread, per frame | A value that follows a finger or a scroll position every frame | Not installed. Nothing in Phase 4 needs a per-frame value. |

`animate.enter` and `animate.leave` exist in Ng Native for mount and unmount transitions. They are
class based, so they are CSS (level 1) underneath; nothing here mounts or unmounts on its own, so they
are not used either.

Two rules cut across the levels. Animate `transform` and `opacity` only: they change what a view looks
like and never what it measures, so nothing is laid out again. And never let JavaScript produce the
frames of something the finger or the eye is watching, which is what the native driver is for.

### Where it lives

```
src/app/shared/theme/theme.ts          `motion`: every duration, curve, spring, distance and press scale
src/app/shared/motion/press-motion.ts  pressMotion(role)   the response of a pressable
src/app/shared/motion/enter-motion.ts  enterMotion(groups, intensity)   a screen's entrance
src/app/testing/motion.ts              test helpers: reduced motion, scale/opacity/rise readers
```

A component never writes a number of its own. It asks the helper, which reads the tokens, so changing
how the whole app feels is an edit to one object in `theme.ts`.

| Token | Value | Meaning |
| --- | --- | --- |
| `duration.instant` | 90 ms | A press going in: it has to feel like the finger itself |
| `duration.fast` | 160 ms | A press coming back, a small fade |
| `duration.normal` | 280 ms | An element entering |
| `easing.standard` | cubic-bezier(.22, .61, .36, 1) | The design's one curve |
| `spring.snappy` | stiffness 400, damping 30, mass 1 | Nearly critically damped: settles with a hair of life, no wobble |
| `enter.full` | rise 12, stagger 40 ms | A tab arriving on its own (Home) |
| `enter.light` | rise 8, stagger 30 ms | A screen that is already arriving by a native transition (Collections, the empty state) |
| `press.opacity` | 0.92 | The dim under a finger |
| `press.role.card` | scale 0.97, spring back | A half-width card, a document |
| `press.role.surface` | scale 0.985, spring back | A full-width card (more points for the same fraction, so less of it) |
| `press.role.control` | scale 0.975, ease back | The search field, the button: they should not bounce |
| `press.role.round` | scale 0.96, spring back | The round add action: small, so a hair more to read as much |

Springs are used for exactly three roles, and sparingly: lists do not bounce.

`motion` is not emitted into `global.css`: nothing in a stylesheet reads it, since the motion that matters
is not CSS. (If a level 1 effect is ever added, emit the tokens as custom properties from
`theme-css.ts` and read them with `var()`; the generated file is checked against `theme.ts`.)

### Press

```html
<pressable accessibilityRole="button" [accessibilityLabel]="label()"
           (pressIn)="press.in()" (pressOut)="press.out()" (press)="...">
  <view class="card" [animatedStyle]="press.style">...</view>
</pressable>
```

The pressable is the touch target and the accessibility element, and it never moves, resizes or
changes opacity. The view inside it, which holds the card's size and surface, is what dips and dims. So
a press can never shrink the area a finger can hit, and the role, label and size of the target are what
they were. `hygiene.test.ts` fails on an `animatedStyle` on a `<pressable>`, and on a pressable that
does not wire `pressIn`, `pressOut`, a role and a label.

Pressing starts an animation on the same value that a previous press may still be running, and
starting an animation on a value replaces the running one, so a flurry of taps goes back from wherever
the last had got to instead of queueing. There is no `parallel` composite: the two values (scale,
opacity) are started on their own so each can be interrupted on its own. A press is cleaned up when its
component is destroyed. Components: `Button`, `SearchTrigger`, `AddAction`, `DocumentCard`,
`CollectionCard` (whose role follows its form: half-width tiles are `card`, the wide ones `surface`).

### Entrance

A screen is a few logical groups, not dozens of elements, and `enterMotion(groups, intensity)` runs them
on ONE native timeline: a single value that goes from 0 to 1 over the whole entrance, and each group reads
its own window of it. A group fades from 0 to 1 while rising its `rise`; group `n` begins `n * stagger` in
and lasts `duration.normal`; six groups are done in under half a second and every control is usable from
the first frame. Each group is already at its starting values in the first commit, so nothing flashes at
its resting place before it begins.

Two things were learned on a device, and are why it is built this way:

- **No per-group `delay`.** React Native runs the `delay` of an animation on a JavaScript timer. On the
  emulator that timer was held up by the JavaScript thread building the screen, so the first group
  finished long before the later ones began. On one timeline nothing is scheduled by JavaScript after the
  start, so the stagger is exact. The bezier curve is sampled into each window (the native driver cannot
  ease an interpolation).
- **It starts after the first render, not in the constructor.** A native-driven animation keeps time from
  the moment it is started, and a tab built on its first visit takes a few hundred milliseconds to appear.
  Started in the constructor, the first group was over before its first frame was drawn.

| Screen | Groups, in order | Intensity |
| --- | --- | --- |
| Home | title and intro; search; the primary collection (or, in an empty vault, the invitation); the rest of the collections (or the suggested ones); Quick Access; the add action | `full` |
| Collections | title; the featured row; the rest | `light` |
| Collection Detail | the empty state, as ONE composition: tile, words and button rise together | `light` |

- **It plays once, when the screen is first rendered.** Tab screens stay mounted, so coming back to Home or
  Collections shows it at rest; it does not replay. Collections is created on the first visit and plays
  then; a pushed Collection Detail is created on each push and plays each time, which is a new screen.
- **A state that does not draw a group does not animate it.** An empty vault has no Quick Access and no
  add action; those groups simply never appear.
- **Detail animates its content only.** The native header, the back button and the push are the
  platform's and are not touched. A test fails if the header is inside an animated group.
- **Interruptions are safe.** Leaving mid-way (a tab switch, Back) stops the animations when the
  component is destroyed, and a press is never blocked by an entrance still running.

### Reduced motion

`Accessibility.reduceMotion` (`@ng-native/device`) is read by the motion layer. With it on, an entrance
is cut to its resting state as soon as the setting is reported (the platform answers asynchronously,
a frame or two after the first paint), and a press dims and does not dip. Nothing else needs to check it,
because nothing else animates.

### Performance rules

1. `transform` and `opacity` only. Never animate a size, margin, padding, or a position that lays out
   again.
2. The native driver, always (`useNativeDriver: true`). JavaScript starts an animation and takes no
   further part in it, so a busy JavaScript thread cannot make a press or an entrance drop frames.
3. No per-frame work in Angular: no signal written from a scroll handler, no `effect` driving a style.
   `hygiene.test.ts` fails on a `(scroll)` binding and on a scroll-offset signal.
4. No `setTimeout` or `setInterval` to sequence motion; a delay is `delay`. `hygiene.test.ts` fails on
   either.
5. Animate a handful of wrappers, not every element; never animate the rows of a long list.
6. Keep every number in `theme.ts`. `hygiene.test.ts` fails on a duration, curve, spring or scale
   written in a component, and on CSS timing written in a stylesheet.
7. Reduced motion is honoured wherever the motion layer animates.

### Scroll effects

None, on purpose. The screens are short, the design draws no scroll-linked motion, and a sticky or
collapsing header would fight the native header and large title the platform gives. If one is ever
justified, the rule is: a CSS `animation-timeline: scroll()` if opacity or transform will do (declarative,
native, free); a Reanimated `workletScroll` writing a `sharedValue` that a `workletStyle` reads if it
needs logic; and never a signal written per scroll frame.

### Gestures and Reanimated

Installed in Phase 9, the document viewer's pinch, double tap and swipe-down-to-close - the first
thing the app does that needs a per-frame value, per this section's own original plan:
`react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`, with
`babel.config.js` adding `react-native-worklets/plugin` (Reanimated 4 moved its transform there,
from `react-native-reanimated/plugin`).

- Ng Native's `@ng-native/components/gestures` and `/reanimated` are the integration. A gesture
  (`Gesture.Pinch()`, `.Pan()`, `.Tap()`, composed with `.Exclusive`/`.Simultaneous`) writes a
  `sharedValue`, and a `workletStyle` on the view reads it, so the finger never involves Angular per
  frame. `<gesture-root>` wraps the whole app (`app.ts`), once - the library's own
  `GestureHandlerRootView`, wrapped the same way.
- A gesture's callbacks run as worklets, on the UI thread, where no component instance exists: read
  and write through locals captured before the gesture is built (`const scale = this.scale;` and the
  like), never `this.scale` inside `.onUpdate()`/`.onEnd()` itself. Call back into Angular (closing
  the viewer past the swipe-down's threshold) with `runOnJS` from `react-native-reanimated`, wrapping
  a plain local closure that may read `this` freely, since it runs back on the JS thread.
- Take the springs and distances from `motion` (`motion.viewer`: the zoom bounds, the double-tap
  scale, the dismiss distance) so a gesture settles like a press does, and none of hygiene's
  `scale: 0.xx` literal-number checks fire on a plain identifier. `hygiene.test.ts` fails if one of
  these packages is installed and nothing imports `@ng-native/components/reanimated` (or `/gestures`
  for Gesture Handler).
- **A real gap in `@ng-native/testing@0.1.2`**: its own Vitest plugin aliases `@ng-native/components/
  gestures`, `react-native-gesture-handler`, `@ng-native/components/reanimated`, `react-native-
  reanimated` and `react-native-worklets` to `@ng-native/testing/src/*.ts`, which the published
  package does not ship - only the compiled `dist/*.js` those files would have come from, which is a
  complete fake (`gestureOf`, a shared value as a signal, a style that "finishes" the instant it is
  set). `vitest.config.mts` points the same five specifiers at `dist` directly, the same fix already
  there for `@ng-native/components/animations` and for the same reason: a resolution gap worked
  around in the one place a test resolves modules, never by editing `node_modules`.

### In tests

Tests run in Node against a fake native layer. `@ng-native/components/animations` resolves, under
Vitest, to Ng Native's own web variant (`vitest.config.mts`, the `webAnimations` alias): the same
`Animated` API on a JavaScript clock, writing the animated values into the fake tree as ordinary props.
So a test can press a button and read the scale it settles at, and watch an entrance's groups arrive. What
it cannot say is how smooth it is on a device or what the native driver does with it; that needs one.

Gestures and worklets get the same kind of fake (above), and the same limit: `gestureOf(node,
'Pinch').callbacks['onUpdate']!(event)` calls a callback directly, in place of a finger a native
recogniser would have driven, and a `[workletStyle]` writes the style its worklet returns the
instant a `sharedValue` it reads changes - `withTiming`/`withSpring` finish at once rather than
animating. A test proves what a gesture's callbacks compute and clamp to, not how a pinch or a
swipe-down's spring actually feels under a finger; that needs a device, same as motion does.

### Not done, and why

- **Haptics.** The design's card press calls for a light haptic. It needs `expo-haptics`, which is a
  native module and a dependency decision of its own (and the place to revisit the `expo-doctor`
  conflict in section 13). Deferred to the first phase that wants a haptic for a real action.
- **Shared-element or hero transitions** between a card and its page. The native stack owns the push.
- **Anything on lists.** There are no long lists yet.

## 9. Data seam and the dev preview

Collection definitions (`id`, `name`, `description`, `icon`) are `PREDEFINED_COLLECTIONS` in
`core/config/predefined-collections.ts`, in display order, with stable ids. Home, Collections and the
collection page all read that one list.

What the vault *contains* is `VAULT_OVERVIEW` in `core/services/vault-overview.ts`: a read-only signal of
how many documents each collection holds, the favourites, and the thumbnails a collection's large card
peeks. It is a seam, not a repository: nothing is stored directly behind it. As of Phase 7 its factory
reads `VaultStore.overview` (`core/services/vault-store.ts`), so Home and Collections switch to the
design's filled-in states the moment a document is saved, with no change to either screen - the seam
did its job.

To look at the filled-in screens, a development build can start with a made-up vault from
`src/app/preview`:

```sh
# bash
EXPO_PUBLIC_POCKIT_PREVIEW=1 npx expo start --clear
# PowerShell
$env:EXPO_PUBLIC_POCKIT_PREVIEW = '1'; npx expo start --clear
```

`app.config.ts` loads the fixtures only when `__DEV__` is true and the variable is `1`, through a
`require` inside that `if`. Metro inlines both, so a release build folds the branch away. This was
checked in a real export: written with an early `return` before the `require`, the fixtures stayed in the
bundle (unreachable, but present); written as a positive `if` they are gone, and a search of the Android
and iOS bundles finds none of their strings. Nothing else imports `preview/`, and `hygiene.test.ts`
holds both that and the shape of the `if`. Use `--clear` when switching, since Metro caches the inlined
value. In Expo Go, Fast Refresh requests a reload for a change to a component class but does not restart
the app: relaunch it.

## 10. Local-first direction

The first version has no backend, no accounts and no network dependency. All data lives on the device:
metadata in a local database, files in app-owned storage, small preferences in key-value storage. The
app must be fully usable offline, because it always is.

Decided in Phase 6: a picked file is copied into app-owned storage, not referenced by its original
URI. Copying keeps the vault independent of the gallery and of URIs that expire; referencing would
have saved space, which the design's documents (photos, IDs, PDFs) are small enough not to need.
`core/storage/vault-files.ts` (`VaultFiles`) does the copying.

Decided in Phase 7: the metadata side is one SQLite table, `document` (`core/storage/pockit-database.ts`
holds the migration, `documents-repository.ts` the SQL). `DocumentsRepository` is the only file that
writes SQL; `VaultStore` is what a feature actually injects (`overview`, `refresh()`, `save()`), the
same shape as Phase 6's `VaultFiles`. A saved row is what finally claims a copy Phase 6 left unclaimed
(see above): `Review.save()` calls `VaultStore.save()` with the collection id, file type and the vault
URI `VaultFiles.copy()` already produced.

Out of scope for the first version: any cloud storage, sync, REST API, Firebase, Supabase, NestJS or
authentication API.

## 11. Planned native capabilities

Not installed yet unless marked; each arrives in its own phase (see `ROADMAP.md`).

| Capability | Likely module | Phase |
| --- | --- | --- |
| Native stack and tab navigation | `@ng-native/router`, `react-native-screens` | 2, installed |
| Custom fonts | `expo-font`, `@ng-native/expo` | 3, installed |
| Motion | `Animated` with the native driver, through `AnimatedStyle` (part of `@ng-native/components`) | 4, done |
| Gestures and per-frame motion | `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` | 9, installed |
| Gallery and camera | `expo-image-picker` | 5, installed |
| Documents and PDFs | `expo-document-picker` | 6, installed |
| File storage | `expo-file-system` | 6, installed |
| Local database | `expo-sqlite` | 7, installed |
| System share sheet | `expo-sharing` | 9, installed |
| Haptics | `expo-haptics` | deferred from 4; with the first real action that wants one |
| Biometric lock | `expo-local-authentication`, `expo-secure-store` | 10, installed |
| Hide from screenshots and app switcher | `expo-screen-capture` | 10, if wanted |

`SecureStorage` (`@ng-native/expo/store`) also pulled in `@react-native-async-storage/async-storage`,
though nothing uses its `Storage` half: the module references both native modules unconditionally, so
Metro refuses to bundle one without the other installed too.

Expo modules are reached through `@ng-native/expo`, which exposes them as injectable, signal-based
Angular services. Add them with `npx expo install <package>` so the version matches the Expo SDK, and
register any config plugin in `app.json`. Check the module's page at <https://ng-native.com> first.

## 12. State management direction

- Angular **signals** and `computed()`; no NgRx or other store library. There is no zone.js, so
  state that must update the UI is a signal.
- **Feature-local first.** A feature keeps its own state in a service or component scoped to it.
- **`core` services for what outlives a feature**, such as the vault overview that several features read.
- **Persistence behind `core/storage`.** State is loaded from and written to the local database through
  that abstraction; features do not know which engine it is.
- Derive with `computed()`. Do not copy state from one signal into another with `effect()`.

## 13. Dependency rules

Import direction (enforced by review today):

```
shell ──▶ features ──▶ shared ──▶ core
              └──────────────────▶ core
```

Package rules:

- Add a dependency in the phase that needs it, not before. Remove it when its last user goes.
- Native only. No Ionic, Capacitor, WebView-based UI, Angular Material, DOM libraries, or imports of
  `@angular/platform-browser` in app code. (It is installed, as a peer of `@angular/router`; nothing
  in the app imports it.) `hygiene.test.ts` fails on a browser-only API or a web element.
- No state-management library, no icon package, no UI framework, and no backend SDK.
- Keep every `@ng-native/*` package on the same version; they pin each other exactly (`0.1.2`).
- Keep every `@angular/*` package on the same version too. They pin each other exactly, so
  `npm install @angular/router` takes the newest release and fails with `ERESOLVE` against an older
  core; install the version core is on (`@angular/router@22.2.0`).
- Expo modules go in with `npx expo install`, not a hand-written version.
- A native module such as `react-native-screens` or `expo-font` must be listed in `package.json`: Expo
  Go bundles it, but a development or release build only links what the app lists.
- `expo-doctor` reports 20 of 21 checks. The one that fails is a conflict upstream: `@ng-native/expo`
  declares `expo-modules-core` a required peer, while the same tool, on Expo SDK 57, says it must not be
  installed directly (it comes with `expo`, which depends on it, and it resolves). Installing it just trades
  one failure for the other, so it is left out. Only the camera, haptics, map and DOM-component services
  import it, none of which the app uses yet; check this again in the haptics phase.
- Application code does not use `document`, `window` or `localStorage`.

## 14. Mobile-specific constraints

- **No DOM.** Elements are lowercase (`<view>`, `<text>`, `<pressable>`, `<scroll-view>`, `<image>`, ...),
  each imported from `@ng-native/components` into the component's `imports`.
- **Text only renders inside `<text>`.** **Events are native**: `(press)`, not `(click)`.
- **Styling**: real CSS compiled at build time, flexbox only. `grid`, float, `::before`/`::after` and
  `:hover` are dropped with a warning, which is why the two-up card rows are flex rows. A cold Metro
  export prints none, and `hygiene.test.ts` plus review keep it so.
- **Colour inheritance is emulated**, for text properties only: `color` set on the root reaches every
  `<text>`; `padding` on a wrapper reaches nothing. Custom properties cascade fully, which is what the
  accent and icon colour rely on.
- **A screen paints nothing.** The host of a routed page is its native screen: it takes
  `host: { class: 'screen' }`. The root host is not a native view, so the app background is painted on
  the safe-area provider too.
- **Native bars take values, not styles.** The header, tab bar and status bar cannot read `var()`.
- **A static attribute on a component host becomes a prop of its native view.** `<app-page-title
  title="...">` puts `title` on a `<view>`, which native ignores. It is inert.
- **Tab icons.** iOS draws an SF Symbol. Android draws a PNG as a template mask the bar tints (seen on a
  device: gold when selected, grey otherwise), because a drawable resource cannot ship through Expo Go.
- **Weight and slant are part of the font name** (section 6). A `font-weight` in a stylesheet is wrong here.
- **Fonts.** A face is registered by name, one file per weight. Under Node (tests) the font `require`s
  are stubbed by a small plugin in `vitest.config.mts`, because the framework's test plugin stubs asset
  requires in source but not those the compiler emits from CSS.
- **No backticks inside an inline template**, even in a comment: the build fails with a misleading error.
- **Accessibility is props**: `accessibilityRole`, `accessibilityLabel`, `[accessibilityState]`. Icons are
  decorative; the control that holds one carries the label.
- **Android colours**: only props whose name ends in `color` are converted to numbers. The previous app
  hit a crash from `<switch [trackColor]>` on Ng Native 0.1.2 on Android. Avoid it until the framework
  is updated, and re-test any new colour-bearing prop on Android.
- **Orientation** is locked to portrait and **`userInterfaceStyle`** to dark in `app.json`.

## 15. Testing

Tests run in Node against a fake native layer, with no simulator: `npm test`. They prove structure,
wiring, styling and navigation resolve; they do not prove how a native control draws, or that a gesture
feels right. That needs a device.

- Render with `renderApp()` (the real routes, bars and design system) or `renderThemed(Component)`
  from `src/app/testing/render.ts`. Both pass the global stylesheet as the app does; without it a
  component's tokens, type and fonts resolve to nothing.
- Select a tab as native would with `selectTab()`; read what is on screen with the helpers in
  `testing/tree.ts` (`named`, `headerTitles`, `textOf`).
- `registerPlatformComponents('android')` is process-wide, so an Android test lives in a file of its own.
- Motion: `testing/motion.ts` has `withReducedMotion`, and readers for the scale, opacity and rise a node is
  drawn at; `entranceGroups()` finds the groups of an entrance. Animations run on a real clock, so wait for
  them with `waitFor` and look nodes up again each time: a commit replaces the nodes it changed.
- Guards that exist on purpose: `global.css` matches `theme.ts`; contrast; fonts registered; no undefined
  token; no literal colour or font in a component; no browser API; demo data isolated; tabs and routes
  match; every screen paints the ground; native bars take the theme; the safe-area owners; an unknown
  collection never fails; motion tokens in range; only the motion layer animates; no motion number or
  timer in a component; no browser animation API; no per-frame scroll signal; every pressable is wired to
  a press response and has a role and a label; the native navigation animates nothing of its own.

## 16. What is intentionally not implemented yet

Persistence, search, favourites, a document viewer, sharing, and renaming, moving and deleting a
document are all real now (Phases 7-11); what is still not built:

- **Multi-page documents.** A document is one file (`core/types/document-item.ts`'s own docstring);
  Review's "Add another page" and the viewer's page dots and second-page peek have nowhere to read a
  second file from. Custom collections are not in scope either - the three built-in ones only.
- **A photo or PDF editor.** The document viewer's "Edit" (Phase 11) changes a document's name and
  collection, never the file itself: there is no crop, rotate or markup tool, and none is planned.
- **A PDF viewer.** A PDF opens the system share sheet instead of rendering in the app (Phase 9's
  "Where native differs from the design", section 7 of this file).
- **No encryption; no backend; no accounts; no sync.** Section 10's local-first direction, unchanged.
- **The rest of Phase 10.** The lock itself and its one Settings toggle are built, out of turn; no
  screenshot protection, and Settings has only that one row, not the design's other groups
  (Appearance, Storage, About).
- **Haptics**, and any motion beyond press feedback, screen entrances and the document viewer's
  gestures (Phase 9): no shared-element transition (the "thumbnail expands to viewer" row of the
  table above), no scroll-linked motion.
- **Android production build settings** (Phase 12): app identifiers, signing, real branding assets.

The schema these phases settled is `core/storage/pockit-database.ts` (the `document` table) and
`core/types/document-item.ts`/`document-preview.ts` (`DocumentItem`, the stored shape;
`DocumentPreview`, what a card or the viewer needs) - not a plan here any more, the real thing.
