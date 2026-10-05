import { AppState, type AppStateSource, type AppStatus } from '@ng-native/device';
import { Biometrics, type AuthenticationResult, type NativeBiometrics } from '@ng-native/expo/biometrics';
import { screen, userEvent, waitFor } from '@ng-native/testing';
import { describe, expect, test, vi } from 'vitest';
import { renderApp } from '../../testing/render.ts';
import { AppLock } from './app-lock.ts';

/** A controllable `AppState`: `current()` is whatever `go()` last set it to. */
function fakeAppState(initial: AppStatus = 'active') {
  let state: AppStatus = initial;
  let listener: ((next: AppStatus) => void) | null = null;
  const source: AppStateSource = {
    current: () => state,
    subscribe: (fn) => {
      listener = fn;
      return () => {
        listener = null;
      };
    },
  };
  return { source, go: (next: AppStatus) => void ((state = next), listener?.(next)) };
}

/** `authenticateAsync` answers `results`, in order, then repeats the last one. */
function fakeBiometrics(...results: readonly AuthenticationResult[]): NativeBiometrics {
  const authenticateAsync = vi.fn<NativeBiometrics['authenticateAsync']>();
  for (const result of results) authenticateAsync.mockResolvedValueOnce(result);
  authenticateAsync.mockResolvedValue(results[results.length - 1]!);
  return {
    hasHardwareAsync: vi.fn().mockResolvedValue(true),
    isEnrolledAsync: vi.fn().mockResolvedValue(true),
    supportedAuthenticationTypesAsync: vi.fn().mockResolvedValue([1]),
    authenticateAsync,
  };
}

const FAILED: AuthenticationResult = { success: false, error: 'authentication_failed' };
const PASSED: AuthenticationResult = { success: true };

describe('the lock, off by default', () => {
  test('the app opens straight to Home', async () => {
    await renderApp();

    expect(screen.getByRole('header', { name: 'Your Vault' })).toBeTruthy();
    expect(screen.queryByRole('header', { name: 'Pockit' })).toBeNull();
  });

  test('turning it on mid-session does not lock the session already open', async () => {
    const { componentRef } = await renderApp();

    componentRef.injector.get(AppLock).enabled.set(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByRole('header', { name: 'Your Vault' })).toBeTruthy();
  });
});

describe('the lock, on', () => {
  test('leaving the app re-locks it, and a retry that passes opens it again', async () => {
    const appState = fakeAppState('active');
    const { componentRef } = await renderApp({
      providers: [
        { provide: AppState.SOURCE, useValue: appState.source },
        { provide: Biometrics.SOURCE, useValue: fakeBiometrics(FAILED, PASSED) },
      ],
    });
    componentRef.injector.get(AppLock).enabled.set(true);

    appState.go('background');

    // The prompt asked on mount failed, so the lock screen is still up.
    await waitFor(() => expect(screen.getByRole('header', { name: 'Pockit' })).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Unlock with biometrics' })).toBeTruthy();

    await userEvent.press(screen.getByRole('button', { name: 'Unlock with biometrics' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Your Vault' })).toBeTruthy());
  });

  test('"Use passcode" asks the same system prompt', async () => {
    const appState = fakeAppState('active');
    const { componentRef } = await renderApp({
      providers: [
        { provide: AppState.SOURCE, useValue: appState.source },
        { provide: Biometrics.SOURCE, useValue: fakeBiometrics(FAILED, PASSED) },
      ],
    });
    componentRef.injector.get(AppLock).enabled.set(true);
    appState.go('background');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Use passcode' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Your Vault' })).toBeTruthy());
  });

  test('a failed prompt leaves the lock screen up', async () => {
    const appState = fakeAppState('active');
    const { componentRef } = await renderApp({
      providers: [
        { provide: AppState.SOURCE, useValue: appState.source },
        { provide: Biometrics.SOURCE, useValue: fakeBiometrics(FAILED, FAILED) },
      ],
    });
    componentRef.injector.get(AppLock).enabled.set(true);

    appState.go('background');

    await waitFor(() => expect(screen.getByRole('header', { name: 'Pockit' })).toBeTruthy());
    await userEvent.press(screen.getByRole('button', { name: 'Unlock with biometrics' }));
    expect(screen.getByRole('header', { name: 'Pockit' })).toBeTruthy();
  });
});
