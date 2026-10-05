# Pockit roadmap

High level, and in order. Each phase is its own piece of work and starts only when asked for.
Dependencies are added in the phase that needs them. See `ARCHITECTURE.md` for the rules each phase
follows.

| # | Phase | Outcome | Adds |
| --- | --- | --- | --- |
| 1 | **Architecture reset** (done) | Old app removed, folder architecture and docs in place, project boots. | nothing |
| 2 | **Design system and navigation shell** (done) | Native stack and four tabs, the native bars, placeholder pages. | `@ng-native/router`, `@angular/router`, `react-native-screens` |
| 3 | **Home, Collections and the Pockit design** (done) | The approved Claude Design as the design system (one TypeScript source, generated stylesheet, bundled fonts and icons); Home in its empty and filled-in states, Collections, and a collection's page with its empty state; the native bars matched to it; checked on an Android emulator. | `expo-font`, `@ng-native/expo` |
| 4 | **Motion system and native animations** (done) | Motion tokens in the design system (the design's 90 to 280 ms, one curve, spring stiffness 400 damping 30); a press response on every pressable (the touch target never moves); a staggered entrance for Home, a lighter one for Collections and the empty state; native navigation untouched; reduced motion honoured; checked on an Android emulator. Gestures are documented, not built. | nothing: `Animated` and `AnimatedStyle` are in `@ng-native/components` |
| 5 | **Gallery and image picker** (done) | Pick a photo from the library or take one. The design's add sheet. | `expo-image-picker` |
| 6 | **Document picker and filesystem** (done) | Pick PDFs and files; decide copy-vs-reference; store files in app-owned storage. | `expo-document-picker`, `expo-file-system` |
| 7 | **Local persistence (SQLite)** (done) | Collection and document models, schema and migrations, `core/storage`; `VAULT_OVERVIEW` backed by it, which switches Home and Collections to their filled-in states with no screen change. Settle the multi-file document shape first. | `expo-sqlite` |
| 8 | **Search and favourites** (done) | Local search across the vault (the design's three search states); a collection's page showing its own documents; favourites and the Quick Access "See all". Marking a document a favourite is still Phase 9's (the action lives on the document viewer). | |
| 9 | **Document viewer** (done) | Fullscreen image viewing with gestures (pinch, double tap, swipe down to close), presented above the tabs; favouriting and sharing, finally wired to the action everywhere a document card already pressed. A PDF opens the system share sheet instead of rendering in the app. | `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`, `expo-sharing` |
| 10 | **Biometrics and security** (lock built, out of turn; rest not started) | Lock on launch and resume (the design's lock screen), secure storage for the lock setting, the Settings screen, optional screenshot protection. | `expo-local-authentication`, `expo-secure-store`, maybe `expo-screen-capture` |
| 11 | Document management | Rename a document, move it to another collection, delete it - the viewer's own "Edit" and "More" actions, inert since Phase 9 because neither had anywhere to go. Not a photo or PDF editor: the file itself is never re-touched, only its name and collection. | nothing |
| 12 | Android production build | Final app identifier and signing, icons and splash, release build, store listing. | EAS configuration |

## Choices made in Phase 3

- **The design is the source of truth.** Where the framework cannot do what it shows, native behaviour
  wins and the difference is recorded in `ARCHITECTURE.md` ("Where native differs from the design").
- **No collection creation yet**, so Collections has no "New collection" tile or "+" button, and shows
  the three built-in collections rather than the design's six sample ones. They arrive with custom
  collections.
- **No "See all"** on Quick Access until there is a Favourites screen (Phase 8).
- **The add buttons do nothing yet.** Adding a document is Phases 5 to 7.
- **Custom fonts**, which the design depends on, so `expo-font` and `@ng-native/expo` came in. The
  fonts are open-licence and bundled.
- **No icon package.** The design's icons are rasterised from its own SVG data (see `assets/icons`).

## Choices made in Phase 4

- **`Animated` with the native driver, not CSS, not Reanimated.** A CSS transition is driven from
  JavaScript in Ng Native 0.1.2, so it is the wrong tool under a finger; Reanimated and Gesture Handler
  would add a Babel plugin and native modules for a value nothing yet drives per frame. Nothing was
  installed.
- **No haptics.** The design's card press names a light haptic. It needs `expo-haptics`, a native
  module and its own dependency decision, so it waits for the first real action that wants one.
- **No scroll effect.** The screens are short and the platform's own header does the rest.
- **Gestures are documented, not built.** `ARCHITECTURE.md` (section 8) says where they plug in
  (Phase 9, the viewer, is the first that needs them).

## Choices made in Phase 5

- **The add sheet is a native `formSheet`, not a hand-built overlay.** `NativeNavigation.present`
  with `sheetAllowedDetents`, `sheetGrabberVisible` and `sheetCornerRadius` gives the design's
  bottom sheet, its scrim and its rounded corners for free, so no overlay view or scrim colour was
  built. Checked on an Android emulator: the system draws the dim and the rounded card.
- **Only two of the design's three sources.** "Files" waits for `expo-document-picker` (Phase 6);
  showing it now with nothing behind it would be a dead row. The same reasoning as Phase 3's
  omitted "New collection" tile.
- **A picked photo is discarded.** There is no document model or storage until Phases 6 and 7, so
  a successful pick closes the sheet exactly as Cancel does; nothing is shown, saved or logged
  toward the user. The design's review screen (naming, choosing a collection, "Save to Pockit")
  waits for a document to actually save, so it was not built as a dead end in front of it.
- **`ImagePicker` and its `capture()`/`pick()` split already existed in `@ng-native/expo`**: it
  answers a cancelled or refused picker as no assets rather than a result to unwrap, and asks for
  the camera permission itself, so the add sheet has no permission handling of its own to write.
- **`addSheetPresentation.detent`, raised from 0.42 to 0.55 after a real device caught it.** The
  detent is a fraction of the *screen*; the sheet's content (the title, three rows, Cancel) is a
  fixed height in points. 0.42 was a near-exact fit on a tall, gesture-navigation emulator; on a
  shorter phone, whose 3-button navigation also eats more of the bottom safe area than gesture
  navigation does, the same fraction left too few points and the bottom of the sheet - Cancel -
  ran past its own edge. 0.55 gives real margin on a short phone without the sheet reading as
  nearly full-screen on a tall one. `add-sheet.ts`'s content is also now in a `scroll-view`, a
  second, independent safety net: free where everything already fits (it simply never scrolls),
  and the one place content can still be reached on whatever device 0.55 still is not enough for.

## Choices made in Phase 6

- **Copy, not reference.** A referenced URI breaks when the original is deleted from the gallery,
  and some pickers' URIs expire once the picker closes; a copy keeps the vault independent of both,
  at the cost of the extra storage the design's documents (photos, IDs, PDFs) are small enough not
  to make a practical problem. `core/storage/vault-files.ts` (`VaultFiles`) does the copying, into
  the app's document directory (survives, backed up) under its own `vault/` folder.
- **All three sources now copy, including Camera and Photos.** The add sheet's `choose()` reads the
  pick, copies it, and only then dismisses; a cancelled picker *or a copy that fails* both leave the
  sheet open to try again.
- **The copy still goes nowhere.** Phase 7 is what gives a copy a name, a collection and a row in
  the database; until then, a copy made and never claimed by a saved document is storage the app
  itself cannot find again. Not a leak a user would notice (the app's own sandboxed directory,
  gone on uninstall), but worth fixing once there is something to fix it with.
- **`expo-file-system`'s `File`/`Paths` are used directly** (`new expo.File(uri)`) to read an
  arbitrary source uri the app did not create itself, alongside the `FileSystem` service
  (`@ng-native/expo`) for the destination; the wrapper's own docstring sanctions this split, since
  it only decides which directory a name lands in; everything else on a `File` is Expo's own,
  undocumented twice.
- **Installing `expo-file-system` pulled in `@react-native-async-storage/async-storage` too**,
  though nothing in the app uses its `Storage` half: `@ng-native/expo/store.ts` references both
  native modules unconditionally at the top of the file, so Metro refused to bundle `SecureStorage`
  (Phase 10) without the other also being installed. Found as a real bundling error, not a guess.
- **A fresh name for every copy** (`vaultFileName`): a timestamp-and-random id, with whatever
  extension the picker's own filename or MIME type gives - the original name is not kept, since two
  picks must never collide and nothing reads it as a path yet.
- **`adb reverse tcp:8081 tcp:8081` does not survive an emulator restart**, and a stale Metro left
  running across an `app.json`/`package.json` change can serve a manifest Expo Go then can't
  reconcile, which surfaces as `Failed to download remote update` - a world away from the actual
  cause. Restarting the emulator (as happened earlier this session, under memory pressure) means
  redoing the port forward before the next device check.

## Choices made in Phase 7

- **One table, `document`.** No separate `collection` table yet: collections are still the
  predefined list from `core/config`, so a document only needs a `collection_id` column pointing at
  one of those ids. A real `collection` table arrives if and when custom collections do.
- **`DocumentsRepository` is the only file that writes SQL.** `VaultStore` (the signal-based service
  every feature actually talks to, following Phase 6's `VaultFiles` pattern) wraps it: an `overview`
  signal, `refresh()`, and `save()` (insert then refresh). `VAULT_OVERVIEW`'s factory now reads
  `VaultStore.overview` instead of a permanently-empty signal.
- **`rowid DESC` breaks ties after `created_at DESC`.** Two saves inside the same millisecond are
  real (a fast device, or a test), and SQLite's own implicit rowid is a free, always-increasing
  tiebreaker: caught by a flaky test before it could be a flaky app.
- **Route params don't reach a pushed screen's inputs with this router's outlet.** Verified directly
  (a throwaway diagnostic test navigated past the add sheet entirely and `withComponentInputBinding`
  still didn't populate a plain input), so Review's data arrives via a small shared service instead
  (`AddDraftStore`, `set()`/`current()`/`clear()`), not route data. Resolver-based binding (as
  `CollectionDetail` uses) is unaffected; only plain params are.
- **Tested against a real SQL engine, not a hand-rolled fake.** `expo-sqlite` can't run under Node,
  but Node's own built-in `node:sqlite` (`DatabaseSync`) can - `testing/sqlite.ts` wraps it in the
  same async shape `PockitDatabase` expects, so a test exercises real SQL (real constraints, real
  ordering) rather than a reimplementation of it.
- **`VaultStore`'s constructor `refresh()` swallows its own rejection.** Without it, every test that
  renders the app (not just this feature's own tests) would throw an unhandled rejection, since no
  database exists under Node by default and nothing else awaits that first call.
- **Device-verified**, including the stylus-handwriting tutorial overlay a stock Android emulator
  shows the first time a text field is focused after a fresh AVD boot: it intercepts taps and typed
  text meant for the app underneath. Disabling it once
  (`adb shell settings put secure stylus_handwriting_enabled 0`) is more reliable than dismissing it
  per-attempt. With it off: Camera → capture → Review (name field correctly starts empty, Phase
  6/7's camera-title fix) → typed "National ID" → Save to Pockit → back on Home with "Personal
  Documents" now showing "1 document".

## Choices made in Phase 8

- **A collection's own page now shows its documents** (the design's screen 04): a two-column grid,
  `VAULT_OVERVIEW.documentsByCollection`, and the floating add button, in the collection's own
  accent. This was really the end of Phase 7 - "Collections to their filled-in states" promised a
  page, not just a count - caught while building Search, which needed the same per-collection data
  and turned up that `CollectionDetail` had only ever shown its empty state, counts and card peeks
  notwithstanding.
- **No search index.** The vault is a handful of documents, not a library: `VAULT_OVERVIEW.documents`
  (every document, newest first) filtered by a case-insensitive substring match on the title is the
  whole of it, recomputed on every keystroke. A real index is a problem for a vault this does not
  have yet.
- **"Recent" and "Try searching" are not built.** The design's empty search state shows a search
  history (this app keeps none) and sample terms (the design's own demo content, not real data,
  per `claude-design-source`). In their place: the three built-in collections, as a shortcut to
  browse by - real data, reusing `CollectionCard`'s own `compact` row rather than a new component.
- **A result presses but goes nowhere**, the same as a document card elsewhere in the app today:
  the document viewer it would open is Phase 9.
- **A new `.text-accent` modifier** (`theme-css.ts`, alongside `.text-secondary`/`.text-collection`):
  Quick Access's "See all" and Search's "Cancel" are the single gold accent, not a collection's own
  tint (`.text-collection` falls back to grey outside a `.collection-<id>` scope, which is exactly
  where both of these sit). `SectionHeader` gained an optional `actionLabel`/`action` for the same
  "title row with a trailing link" shape Quick Access and, now, nothing else yet, need.
- **Favorites (the design's "Quick Access" page, screen 13) reuses the native header**, not the
  design's custom circular back button and oversized serif title: the same divergence already
  decided for a collection's own page (`ARCHITECTURE.md`, "Where native differs from the design"),
  for the same reason. It is real and pushed from Home's "See all", but today always shows its own
  empty state: nothing can mark a document a favourite yet, since that action lives on the document
  viewer (Phase 9), which does not exist either. Built now anyway, rather than waited on, because a
  page that is only ever empty until the next phase is still a real, tested page today (the same
  reasoning as Phase 6's copies going nowhere until Phase 7 gave them somewhere).
- **Not yet device-verified.** The emulator and Metro were stopped by the harness's own
  memory-pressure guard before this phase's screens were built, and were not restarted (the guard's
  own note says not to, on the chance memory is still short); everything above is covered by the
  automated suite only. The next device pass should check: Search's browse-by-collection state,
  typing a query down to the one real document Phase 7 saved on that emulator and its highlight,
  that document now showing on Personal Documents' own page instead of the empty state, and the
  floating add button above it.

## Choices made in Phase 9

Two decisions here were the user's, not a default: this phase shipped only after asking.

- **No PDF viewer.** The one document ever actually saved and tested on a device is a photo; a real
  in-app PDF render needs a new native dependency, and Android's `WebView` (unlike iOS's) cannot
  render one on its own, so "PDF viewing" without that extra layer would be untested on the
  platform this project actually checks against. A PDF document instead goes straight to the system
  share sheet - the device's own "Open with" - which needed nothing new beyond `expo-sharing`, works
  identically on both platforms, and was already the chosen way to share an image (below). Image
  viewing, with the design's full pinch/double-tap/swipe-down gestures, was not simplified.
- **Multi-page documents are still not built** (Review's own "one file per document" docstring,
  unchanged since Phase 7), so the design's page dots, its second-page peek and its "N of M" caption
  are not: a document never has a second page to show one for.
- **Reanimated, worklets and Gesture Handler, finally installed** - the one thing Phase 4 deliberately
  left for "the phase that clearly needs a per-frame value" (`ARCHITECTURE.md`, section 8). Built
  exactly to that section's own seam: `@ng-native/components/gestures` and `/reanimated`, a gesture's
  callbacks reading and writing `sharedValue`s through locals (never `this`, since a callback runs as
  a worklet on the UI thread, where no component instance exists), a `[workletStyle]` turning those
  into the image's transform and the screen's own dismiss-drag fade. `<gesture-root>` now wraps the
  whole app (`app.ts`), the one place a `[gesture]` is recognised from.
- **A real packaging gap in `@ng-native/testing@0.1.2`**, found getting a single test to import
  `@ng-native/components/gestures`: the package's own Vitest plugin aliases that entry point (and
  three others - the gesture library, Reanimated, and worklets) to `@ng-native/testing/src/*.ts`
  files the published package does not ship, though the compiled `dist/*.js` they would have been
  built from does exist and is a complete, well-made fake (`gestureOf`, a shared value as a signal,
  a style that "finishes" the instant it is set). Worked around in `vitest.config.mts` with four
  more `resolve.alias` entries pointing at the `dist` files directly - the same fix already there
  for `@ng-native/components/animations`, for the same reason, not a patch to `node_modules`.
- **Favouriting, finally wired.** `DocumentsRepository.setFavorite` (one `UPDATE`) and
  `VaultStore.setFavorite(id, favorite)` - an explicit next value, not "the opposite of what a
  possibly-stale `DocumentPreview` last said" - back every document card's press, everywhere one
  already existed (Home, a collection's page, Favorites, a search result): `DocumentViewerStore`
  decides where a tap goes, so no screen has its own copy of that decision. The viewer shows the
  change at once (a local signal, set optimistically) rather than waiting on the write and a full
  vault refresh.
- **A new colour, `viewerGround` (`#0C0F10`)**: the viewer's ground is darker than the rest of the
  app on purpose (the design's own choice, so a photo reads as the only thing on the screen), which
  is a token in `theme.ts` like every other colour, not a one-off literal.
- **One new icon, `share`**, rasterised the same way as every other (the design's own SVG path, a
  white mask at 1x/2x/3x). `Edit` and `More`, the design's other two actions on this screen, are not
  built: neither has anywhere to go yet (no editor, no menu), and an inert icon that only ever
  presses and does nothing is the thing this project avoids building (`ARCHITECTURE.md`'s already
  the plan for the collection page's own "more").
- **Not yet device-verified.** The emulator and Metro were stopped by the harness's own
  memory-pressure guard mid-way through Phase 8 and were never restarted this session; Phase 9 was
  built and asked for by name regardless, per explicit instruction, with everything above covered by
  the automated suite only (including the gestures themselves, driven directly through
  `@ng-native/testing`'s `gestureOf`, not a finger). The next device pass should check: a real pinch
  and double tap against the design's bounds, the swipe-down's feel (the fake "finishes" an
  animation the instant it is set, which a spring on a device will not), the favourite heart and the
  share sheet against the one real document in the vault, and a real PDF opening outside the app.

## Choices made in Phase 10 (out of turn)

Only the lock itself and the one Settings toggle that turns it on: not the rest of the Settings
screen (Appearance, Storage, About are later), and not screenshot protection (`expo-screen-capture`,
still optional and unstarted). Done now, ahead of Phases 6 to 9, because it does not depend on them:
there is still no document to view or store, only the app to get into.

- **Off by default.** A person turns it on in Settings; nothing is locked until they do.
- **The lock screen covers the stack, in front of it, rather than replacing it.** The first build
  swapped `<native-stack-outlet>` for the lock screen in an `@if`/`@else`, matching the docstring's
  original claim that the vault would not even be mounted while locked. A device test caught it:
  tearing the outlet down and building a fresh one does not resume navigation (Home never
  reappeared) and would restart its entrance every time. `ARCHITECTURE.md` section 7 has the fix:
  the stack stays mounted, `LockScreen` is absolutely positioned over it. Hiding the vault from a
  screenshot or the app switcher is a separate, optional step (`expo-screen-capture`), not this
  screen's job.
- **Allows the device passcode as a fallback**, per the design's "Use passcode" row. Expo's own
  `authenticateAsync` already falls back to it when biometrics fail, so "Use passcode" calls the
  same `authenticate()` as the main button rather than a distinct native call Expo does not expose.
- **The switch is disabled, with a line saying why, when the device has no fingerprint or face set
  up.** Checked on an Android emulator with nothing enrolled: without this, turning the lock on
  would lock the owner out of Settings too, since Settings is behind the same lock once it is on.
- **Turning the lock on mid-session does not lock the session already open.** `AppLock.locked()` is
  `enabled() && !authenticated()`, and `authenticated` starts at whatever `enabled` already was at
  launch - not re-derived from it - so flipping the Settings switch while the app is in front of you
  does not immediately show the lock screen over your own hand.
- **A new `@react-native-async-storage/async-storage` dependency**, though nothing in the app uses
  `Storage` (only `SecureStorage`): `@ng-native/expo/store.ts` references both native modules
  unconditionally, so Metro cannot bundle `SecureStorage` without the other also being installed.
  Found by a real bundling error, not a guess.
- **A new type style, `eyebrow`, and a new modifier, `text-secondary`.** The Settings group heading
  (spaced, bold, tertiary caps) matches nothing in the existing scale and is a shape every future
  group reuses; `text-secondary` recolours the add sheet's own "Cancel", a Phase 5 row that had been
  given the primary text colour by mistake; the design always asked for secondary there too.
- **Two new icons, `face` and `logo`**, rasterised the same way as Phase 5's: the design's own SVG
  paths, white-on-transparent masks at 1x/2x/3x. `logo` is the lock screen's badge mark; `face` is
  reused for both the lock screen's biometric badge and the Settings row.
- **The design's two faint decorative rings behind the lock screen's badge are not built.** Pure
  ambiance with its own two one-off accent-opacity values; not worth two new colour tokens for a
  single screen.

## Choices made in Phase 11

Added at the user's own request, once Phase 9's viewer made "Edit" and "More" real buttons with
nowhere to go the obvious next gap to close.

- **Metadata only: a name and a collection, never the file.** Confirmed directly rather than
  assumed - the ask was "rename + delete, and maybe move-to-collection", and asking back ("editing
  the document's metadata... or re-editing the actual image/file itself?") settled it before any
  code was written. There is no photo or PDF editor here and none is planned; `ARCHITECTURE.md`'s
  "not implemented yet" list says so plainly, so a later phase does not have to rediscover it.
- **`DocumentsRepository.update`/`.remove` and `VaultStore.update`/`.remove`**, the same one-method-
  per-change shape `setFavorite` (Phase 9) already set: an explicit `{ title, collectionId }` or an
  id, never "whatever the screen already had," so a stale read can never write back a stale value.
- **"Edit" is a screen, pushed over the viewer the same way Review is pushed over the add sheet**
  (`DocumentEdit`, closely mirroring Review's own name-field-and-collection-picker shape, since it
  is the same two pieces of information asked the same way) - not a modal or an inline form, both
  of which would have needed building a second way to ask the same question. "More" needed no
  screen of its own: with exactly one action behind it (Delete), it goes straight to a destructive
  `Dialogs.confirm`, not a menu with one item in it.
- **The viewer's title is now read from `DocumentViewerStore` reactively (`title()`), not the
  one-time snapshot (`item`) every other field still is.** Renaming or moving a document never
  changes its `id`, `fileUri` or `fileType`, so the gesture closures, `share()` and `deleteDocument()`
  keep the plain snapshot; only the displayed name needed to change after `DocumentEdit` pops back
  to a viewer that never remounted. `DocumentViewerStore.replace()` is what `DocumentEdit` calls on
  a successful save to make that true.
- **Two new icons, `edit` and `more`, rasterised from the design's own SVG paths** (a pencil; three
  dots) the same way as every other icon - except the tool that usually does this (Chrome DevTools,
  driving a canvas) was unavailable mid-session, so this once a temporary devDependency
  (`@resvg/resvg-js`) rendered the same path data to PNG directly in Node and was removed again
  immediately after; nothing about the committed assets or the process going forward differs.
- **A real device, again.** The user found the add sheet's clipped Cancel (above) and asked for this
  phase from their own phone, mid-session - not the emulator, and not a scenario this project's own
  device-verification pass had reached yet. Not yet re-verified on that same phone after the fixes
  in this phase; the next pass should confirm the sheet now shows everything without scrolling, and
  that Edit, the collection picker, Save and Delete all work on a real document.

## Open items

- **Tertiary text contrast.** The design's tertiary grey (`#6B7274`) measures about 3.6:1 on the ground,
  3.2:1 on a card and 3.4:1 on the tab bar: under the 4.5:1 AA asks of small text. It is kept as designed
  and pinned at 3:1 by a test. A slightly lighter grey would fix it; that is a design decision.
- **iOS has not been run.** Check the tab bar, the header and the SF Symbols on a simulator or device.
- **`expo-doctor` is 20 of 21**: an upstream conflict about `expo-modules-core` (see `ARCHITECTURE.md`,
  section 13). Revisit it with the haptics service, which Phase 4 deferred.
- **App identifiers.** `app.json` sets no `android.package` or `ios.bundleIdentifier`. Choose the real
  ones before the first development or release build: they cannot change after the first store upload.
- **Branding assets.** `assets/icon.png`, `splash-icon.png` and `android-icon-*.png` are the Expo
  template's placeholders. The wordmark and lock-screen mark in the design are the starting point.
- **`@ng-native/*` is 0.1.2**, an early release. Its documentation and its behaviour differ in at least
  one place (font weights); verify on a device before trusting a documented feature.
- **The lock has not been checked against a real fingerprint or face.** Checked on an Android
  emulator with nothing enrolled (`available()` false, the switch correctly disabled) and with
  every path through `AppLock` faked in tests; a real pass, a real failure, a real `canAskAgain:
  false` after too many attempts, and iOS, are not. Setting up the emulator's virtual fingerprint
  needs a device PIN first, and Android's own PIN-entry screen is `FLAG_SECURE` (refuses a
  screenshot), which is why it was not driven blind.
