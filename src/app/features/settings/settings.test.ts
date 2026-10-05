import { Biometrics, type NativeBiometrics } from '@ng-native/expo/biometrics';
import { fireEvent, screen } from '@ng-native/testing';
import { describe, expect, test, vi } from 'vitest';
import { AppLock } from '../../core/services/app-lock.ts';
import { renderThemed } from '../../testing/render.ts';
import { Settings } from './settings.ts';

function fakeBiometrics(available: boolean): NativeBiometrics {
  return {
    hasHardwareAsync: vi.fn().mockResolvedValue(available),
    isEnrolledAsync: vi.fn().mockResolvedValue(available),
    supportedAuthenticationTypesAsync: vi.fn().mockResolvedValue(available ? [1] : []),
    authenticateAsync: vi.fn(),
  };
}

describe('Settings, with no biometrics on the device', () => {
  test('explains why, and turns the switch off and unreachable', async () => {
    await renderThemed(Settings, {
      providers: [{ provide: Biometrics.SOURCE, useValue: fakeBiometrics(false) }],
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      screen.getByText('No fingerprint or face unlock is set up on this device.'),
    ).toBeTruthy();
    const toggle = screen.getByRole('switch', { name: 'Biometric Lock' });
    expect(toggle.props['value']).toBe(false);
    expect(toggle.props['disabled']).toBe(true);
  });
});

describe('Settings, with biometrics set up', () => {
  test('the switch is reachable, and flips the lock on and off', async () => {
    const { componentRef } = await renderThemed(Settings, {
      providers: [{ provide: Biometrics.SOURCE, useValue: fakeBiometrics(true) }],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText('No fingerprint or face unlock is set up on this device.')).toBeNull();

    const toggle = screen.getByRole('switch', { name: 'Biometric Lock' });
    expect(toggle.props['disabled']).toBeFalsy();

    await fireEvent(toggle, 'change', { value: true });

    expect(componentRef.injector.get(AppLock).enabled()).toBe(true);
  });
});
