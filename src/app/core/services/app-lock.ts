import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AppState } from '@ng-native/device';
import { Biometrics } from '@ng-native/expo/biometrics';
import { SecureStorage } from '@ng-native/expo/store';

/** Where the setting lives in the keychain / Android keystore. */
const ENABLED_KEY = 'pockit.biometricLock';

/**
 * Whether the vault is behind a biometric lock, and whether this time in the app has passed it.
 *
 * The setting is the keychain's, not a password of the app's own: `unlock()` shows the system
 * prompt, which is whatever the device owner has enrolled (fingerprint, face) and, since the
 * passcode is allowed as its fallback, their device passcode too. There is nothing here for the
 * app to get right or wrong about who they are.
 *
 * Off by default: a person turns it on in Settings. Turning it on mid-session does not lock the
 * session already open, only the next one. Leaving the app (background) while it is on re-locks
 * it, so coming back always asks again.
 */
@Injectable({ providedIn: 'root' })
export class AppLock {
  private readonly appState = inject(AppState);
  private readonly biometrics = inject(Biometrics);
  private readonly store = inject(SecureStorage);

  /** Whether the person has turned the lock on. */
  readonly enabled = this.store.signal(ENABLED_KEY, false);

  /** Whether this time in the app has passed the lock, if it has one. */
  private readonly authenticated = signal(!this.enabled());

  /** Whether the lock screen should be showing right now. */
  readonly locked = computed(() => this.enabled() && !this.authenticated());

  constructor() {
    effect(() => {
      if (this.enabled() && this.appState.current() === 'background') {
        this.authenticated.set(false);
      }
    });
  }

  /** Shows the system prompt. Resolves to whether it passed. */
  async unlock(): Promise<boolean> {
    const result = await this.biometrics.authenticate('Unlock Pockit', {
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    });
    if (result.success) {
      this.authenticated.set(true);
    }
    return result.success;
  }
}
