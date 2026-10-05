import type { NativeFile, NativeFiles } from '@ng-native/expo/file-system';

/** An in-memory `expo-file-system`: good enough to prove what a service writes, and where. */
export function fakeFileSystem() {
  const store = new Map<string, Uint8Array>();
  const file = (path: string): NativeFile => ({
    uri: `file://${path}`,
    get exists() {
      return store.has(path);
    },
    get size() {
      return store.get(path)?.byteLength ?? 0;
    },
    create: () => void (store.has(path) || store.set(path, new Uint8Array())),
    write: (content) =>
      void store.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content),
    text: async () => new TextDecoder().decode(store.get(path)),
    textSync: () => new TextDecoder().decode(store.get(path)),
    bytes: async () => store.get(path) ?? new Uint8Array(),
    delete: () => void store.delete(path),
  });
  const native: NativeFiles = {
    cacheDirectory: {},
    documentDirectory: {},
    file: (_directory, name) => file(name),
  };
  return { native, store };
}
