import type { VaultOverview } from '../core/services/vault-overview.ts';

/**
 * A made-up vault, for looking at the screens with something in them. It is not data and it is not
 * the app's state: it exists so the filled-in Home can be seen on a device, and in tests.
 *
 * The app never imports this file. `app.config.ts` loads it only in a development build started
 * with `EXPO_PUBLIC_POCKIT_PREVIEW=1` (see docs/ARCHITECTURE.md), and a release build drops it.
 * The counts and documents match the "Home" screen of the design.
 */
export const PREVIEW_VAULT: VaultOverview = {
  counts: { 'personal-documents': 6, certificates: 4, important: 3 },
  peeks: { 'personal-documents': [{ tone: 'teal' }, { tone: 'indigo' }] },
  favorites: [
    {
      id: 'preview-national-id',
      title: 'National ID',
      kind: 'ID · Front & back',
      thumbnail: { tone: 'indigo' },
      badge: '2 pages',
      favorite: true,
    },
    {
      id: 'preview-driving-license',
      title: 'Driving License',
      kind: 'License',
      thumbnail: { tone: 'teal' },
      favorite: true,
    },
    {
      id: 'preview-passport',
      title: 'Passport',
      kind: 'Passport',
      thumbnail: { tone: 'rose' },
      favorite: true,
    },
  ],
};
