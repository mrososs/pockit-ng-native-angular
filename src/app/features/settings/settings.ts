import { Component, inject, signal } from '@angular/core';
import { Switch, Text, View } from '@ng-native/components';
import { Biometrics } from '@ng-native/expo/biometrics';
import { AppLock } from '../../core/services/app-lock.ts';
import { Icon } from '../../shared/components/icon/icon.ts';
import { PageTitle } from '../../shared/components/page-title/page-title.ts';
import { TabScreen } from '../../shared/components/tab-screen/tab-screen.ts';

/**
 * Settings, so far: just the Security group and its one row, turning the biometric lock on and
 * off. The rest of the design's groups (Appearance, Storage, About) are later phases.
 *
 * The switch is disabled, with a line saying why, when the device has nothing enrolled to check:
 * turning the lock on with no way to pass it would lock the owner out of Settings too, since
 * Settings is behind the same lock once it is on.
 */
@Component({
  selector: 'app-settings',
  imports: [Icon, PageTitle, Switch, TabScreen, Text, View],
  host: { class: 'screen' },
  template: `
    <app-tab-screen>
      <view class="head">
        <app-page-title title="Settings" />
      </view>

      <text class="text-eyebrow group">Security</text>
      <view class="card">
        <view class="row">
          <app-icon name="face" [size]="22" class="rowIcon" />
          <view class="grow">
            <text class="text-card-heading">Biometric Lock</text>
            @if (!biometricsAvailable()) {
              <text class="text-caption unavailable">
                No fingerprint or face unlock is set up on this device.
              </text>
            }
          </view>
          <switch
            accessibilityLabel="Biometric Lock"
            [checked]="lock.enabled()"
            (checkedChange)="setEnabled($event)"
            [disabled]="!biometricsAvailable()"
          />
        </view>
      </view>
    </app-tab-screen>
  `,
  styles: `
    .head {
      padding-top: var(--space-xl);
    }
    .group {
      margin: var(--space-xl) 0 var(--space-sm) var(--space-xs);
    }
    .card {
      border-radius: var(--radius-xl);
      background-color: var(--color-surface);
      overflow: hidden;
    }
    .row {
      flex-direction: row;
      align-items: center;
      gap: var(--space-md);
      height: 54px;
      padding: 0 var(--space-lg);
    }
    .rowIcon {
      --icon-color: var(--color-text-secondary);
    }
    .grow {
      flex: 1;
    }
    .unavailable {
      margin-top: 2px;
    }
  `,
})
export class Settings {
  protected readonly lock = inject(AppLock);
  private readonly biometrics = inject(Biometrics);

  /** Starts true so the switch is not seen disabled for a tick while the real answer comes in. */
  protected readonly biometricsAvailable = signal(true);

  constructor() {
    void this.biometrics.available().then((available) => this.biometricsAvailable.set(available));
  }

  protected setEnabled(value: boolean): void {
    this.lock.enabled.set(value);
  }
}
