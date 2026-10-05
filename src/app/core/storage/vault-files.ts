import { Injectable, InjectionToken, inject } from '@angular/core';
import { expoModule } from '@ng-native/expo';
import { FileSystem } from '@ng-native/expo/file-system';

/** The slice of `expo-file-system`'s `File` this needs, to read a uri the app did not create. */
export interface NativeSourceFile {
  bytes(): Promise<Uint8Array>;
}
export interface NativeFileReader {
  open(uri: string): NativeSourceFile;
}

/**
 * Copies a picked photo or document into the vault's own storage, in the app's document directory
 * (survives, and is backed up), under its own `vault/` folder.
 *
 * Phase 6's decision: copy, not reference. A referenced URI breaks when the original is deleted
 * from the gallery, and some pickers' URIs expire once the picker closes; a copy keeps the vault
 * independent of both. The cost is the extra storage, which the design's documents (photos, IDs,
 * PDFs) are small enough not to make a practical problem.
 *
 * What a copy is *for* is Phase 7: nothing here tracks the result, so until the document model and
 * its database exist, a copy made and never named in a saved document is storage the app will not
 * find again on its own.
 */
@Injectable({ providedIn: 'root' })
export class VaultFiles {
  /** Overridden in a test to read bytes without a real file system. */
  static readonly SOURCE = new InjectionToken<NativeFileReader | null>('pockit.vaultFilesSource', {
    factory: () => {
      const expo = expoModule('expo-file-system', () => require('expo-file-system'));
      return expo ? { open: (uri: string) => new expo.File(uri) } : null;
    },
  });

  private readonly reader = inject(VaultFiles.SOURCE);
  private readonly fileSystem = inject(FileSystem);

  /** Copies `sourceUri` into `vault/<name>` and returns its new, permanent uri. */
  async copy(sourceUri: string, name: string): Promise<string> {
    if (!this.reader) {
      throw new Error('[pockit] expo-file-system is not installed');
    }
    const bytes = await this.reader.open(sourceUri).bytes();
    const file = this.fileSystem.document(`vault/${name}`);
    this.fileSystem.write(file, bytes);
    return file.uri;
  }
}
