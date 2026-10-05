import { Component, inject } from '@angular/core';
import { Pressable, SafeAreaView, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { AppLock } from '../../core/services/app-lock.ts';
import { Button } from '../../shared/components/button/button.ts';
import { Icon } from '../../shared/components/icon/icon.ts';
import { pressMotion } from '../../shared/motion/press-motion.ts';

/**
 * The design's lock screen (screen 15), absolutely positioned over the whole app by `App` while
 * `AppLock.locked()` is true, covering it rather than replacing it (see `app.ts`).
 *
 * Asks for biometrics as soon as it appears, so a fast owner barely sees it; the button is there
 * for a retry after a cancel or a failure. "Use passcode" is a second way in for the same reason
 * the design draws it, but it is the same system prompt: `authenticate()` already falls back to
 * the device passcode, so both pressables call it.
 *
 * The decorative rings behind the badge in the design are not built: pure ambiance, not worth a
 * colour token of their own for one screen.
 */
@Component({
  selector: 'app-lock-screen',
  imports: [AnimatedStyle, Button, Icon, Pressable, SafeAreaView, Text, View],
  template: `
    <safe-area-view [edges]="['top', 'bottom']" class="lock">
      <view class="center">
        <view class="badge">
          <app-icon name="logo" [size]="32" />
        </view>
        <text accessibilityRole="header" class="text-title brand">Pockit</text>
        <text class="text-lead subtitle">Your important documents are protected.</text>
      </view>
      <view class="bottom">
        <view class="face">
          <app-icon name="face" [size]="28" />
        </view>
        <app-button label="Unlock with biometrics" (action)="tryUnlock()" />
        <pressable
          accessibilityRole="button"
          [accessibilityLabel]="'Use passcode'"
          (pressIn)="press.in()"
          (pressOut)="press.out()"
          (press)="tryUnlock()"
        >
          <view class="passcode" [animatedStyle]="press.style">
            <text class="text-label text-secondary">Use passcode</text>
          </view>
        </pressable>
      </view>
    </safe-area-view>
  `,
  styles: `
    :host {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    .lock {
      flex: 1;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3xl) var(--space-xl);
      background-color: var(--color-background);
    }
    .center {
      align-items: center;
      margin-top: var(--space-3xl);
    }
    .badge {
      align-items: center;
      justify-content: center;
      width: 88px;
      height: 88px;
      border-radius: var(--radius-2xl);
      background-color: var(--color-accent);
    }
    .badge app-icon {
      --icon-color: var(--color-on-accent);
    }
    .brand {
      margin-top: var(--space-lg);
    }
    .subtitle {
      margin-top: var(--space-xs);
      text-align: center;
    }
    .bottom {
      align-items: center;
      width: 100%;
    }
    .face {
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--color-accent-outline);
      margin-bottom: var(--space-lg);
    }
    .face app-icon {
      --icon-color: var(--color-accent);
    }
    .bottom app-button {
      width: 100%;
    }
    .passcode {
      align-items: center;
      justify-content: center;
      height: var(--size-control);
    }
  `,
})
export class LockScreen {
  private readonly lock = inject(AppLock);

  protected readonly press = pressMotion('control');

  constructor() {
    void this.tryUnlock();
  }

  protected async tryUnlock(): Promise<void> {
    await this.lock.unlock();
  }
}
