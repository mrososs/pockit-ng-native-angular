import { Injectable, InjectionToken, inject } from '@angular/core';
import { expoModule } from '@ng-native/expo';

/** The slice of `expo-sharing` this needs. */
export interface NativeSharing {
  isAvailableAsync(): Promise<boolean>;
  shareAsync(url: string, options?: { readonly mimeType?: string; readonly dialogTitle?: string }): Promise<void>;
}

/**
 * The system share sheet, for a document's own "Share" action and, since this app renders no PDF
 * of its own, for opening one: the sheet is also how a person reaches a PDF viewer they already
 * have. Without the module, or on a device with nothing to share to (`isAvailableAsync` false),
 * `share` resolves having done nothing rather than throwing on a device the design cannot foresee.
 */
@Injectable({ providedIn: 'root' })
export class Sharing {
  /** Overridden in a test to share without a real share sheet. */
  static readonly SOURCE = new InjectionToken<NativeSharing | null>('pockit.sharingSource', {
    factory: () => expoModule('expo-sharing', () => require('expo-sharing')),
  });

  private readonly native = inject(Sharing.SOURCE);

  async share(uri: string, mimeType?: string): Promise<void> {
    if (!this.native || !(await this.native.isAvailableAsync())) {
      return;
    }
    await this.native.shareAsync(uri, { mimeType });
  }
}
