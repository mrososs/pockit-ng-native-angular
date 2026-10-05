# Pockit

A personal document vault for your phone: keep the files and images that matter (IDs, certificates,
receipts, important photos) organised and one tap away, instead of buried in the gallery.

Built with [Angular Native](https://ng-native.com): Angular components rendered as real native iOS and
Android views, inside an Expo app. Local-first, with no backend.

> Early stage. The Pockit design system, the navigation shell, and the Home, Collections and
> collection screens exist. Documents, search and the rest do not yet: `docs/ROADMAP.md`.

```sh
npm start          # Metro; scan the QR code with Expo Go, or press i / a for a simulator
npm run ios        # straight to the iOS simulator
npm run android    # straight to the Android emulator
npm test           # tests, in Node with no simulator
npm run typecheck
npm run theme      # regenerate the design stylesheet after editing src/app/shared/theme/theme.ts
```

To see the filled-in screens with made-up documents, start a development build with
`EXPO_PUBLIC_POCKIT_PREVIEW=1` (see `docs/ARCHITECTURE.md`, section 9).

`src/app/app.ts` is the root component and `src/main.ts` mounts it. Expo Go is enough for development; a
release build or a native module Expo Go does not include needs a development build
(`npx expo run:ios`).

The app targets iOS and Android, so there is no `npm run web`.

- `docs/ARCHITECTURE.md`: structure, boundaries and rules.
- `docs/ROADMAP.md`: the phases, in order.
- `AGENTS.md`: how this framework differs from the web Angular a coding agent knows (Claude Code
  reads it through `CLAUDE.md`).

Framework docs: https://ng-native.com
