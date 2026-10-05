import type { Provider, Type } from '@angular/core';
import { render, type RenderOptions } from '@ng-native/testing';
import { appConfig } from '../app.config.ts';
import { App } from '../app.ts';
import { globalStyleSheet } from '../shared/theme/global-styles.ts';

/**
 * Renders a component with the design system's global stylesheet, as the app mounts it: without it
 * a component's tokens, type classes and fonts resolve to nothing.
 */
export function renderThemed<T>(component: Type<T>, options: RenderOptions<T> = {}) {
  return render(component, { globalStyles: globalStyleSheet(), ...options });
}

/** Renders the whole app: the real routes, the native bars and the design system. */
export function renderApp(extra: { readonly providers?: readonly Provider[] } = {}) {
  return render(App, {
    globalStyles: globalStyleSheet(),
    providers: [...appConfig.providers, ...(extra.providers ?? [])],
  });
}
