import { Component, inject } from '@angular/core';
import { SafeAreaProvider } from '@ng-native/components';
import { StatusBar } from '@ng-native/device';
import { NativeStackOutlet } from '@ng-native/router';
import { AppLock } from './core/services/app-lock.ts';
import { LockScreen } from './features/settings/lock-screen.ts';

/**
 * The root component, mounted by `src/main.ts`: the safe-area insets and the root native stack,
 * whose first screen is the tab bar (`app.routes.ts`).
 *
 * The design tokens, the type scale and the fonts are not here: they are the global stylesheet
 * (`shared/theme/global.css`), which `main.ts` passes to `mount()` and which every component sees.
 * `<safe-area-provider>` measures the insets once, here: without it every `<safe-area-view>` below
 * reads zero and content slides under the notch.
 *
 * While `AppLock.locked()` is true, the lock screen covers the stack rather than replacing it: the
 * stack stays mounted underneath (tearing down and recreating `<native-stack-outlet>` does not
 * resume navigation cleanly, and starts the Home entrance over), and `LockScreen` is absolutely
 * positioned over it. Hiding the vault from a screenshot or the app switcher is `expo-screen-capture`
 * (`ARCHITECTURE.md`, section 11), a separate, optional step, not this screen's job.
 */
@Component({
  imports: [LockScreen, NativeStackOutlet, SafeAreaProvider],
  selector: 'app-root',
  template: `
    <safe-area-provider class="fill">
      <native-stack-outlet />
      @if (lock.locked()) {
        <app-lock-screen />
      }
    </safe-area-provider>
  `,
  styles: `
    :host {
      flex: 1;
      /* Text inherits this, so a <text> with no colour of its own is not black on black. */
      color: var(--color-text-primary);
    }
    /* The root host is not a native view, so the app background is painted on this one. */
    .fill {
      flex: 1;
      background-color: var(--color-background);
    }
  `,
})
export class App {
  protected readonly lock = inject(AppLock);

  constructor() {
    // The interface is dark, so the status bar draws light content. A light theme makes it 'auto'.
    inject(StatusBar).set({ style: 'light' });
  }
}
