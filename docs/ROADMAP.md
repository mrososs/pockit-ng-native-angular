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
| 7 | Local persistence (SQLite) | Collection and document models, schema and migrations, `core/storage`; `VAULT_OVERVIEW` backed by it, which switches Home and Collections to their filled-in states with no screen change. Settle the multi-file document shape first. | `expo-sqlite` |
| 8 | Search and favourites | Local search across the vault (the design's three search states); favourites and the Quick Access "See all". | |
| 9 | Document viewer | Fullscreen image and PDF viewing with gestures, presented above the tabs. | |
| 10 | **Biometrics and security** (lock built, out of turn; rest not started) | Lock on launch and resume (the design's lock screen), secure storage for the lock setting, the Settings screen, optional screenshot protection. | `expo-local-authentication`, `expo-secure-store`, maybe `expo-screen-capture` |
| 11 | Android production build | Final app identifier and signing, icons and splash, release build, store listing. | EAS configuration |

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
