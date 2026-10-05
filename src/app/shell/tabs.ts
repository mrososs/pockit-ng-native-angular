import { Component, inject } from '@angular/core';
import { HostEngine, nativePlatform } from '@ng-native/fabric';
import { NativeHeader, NativeTab, NativeTabsOutlet, type TabIcon } from '@ng-native/router';
import { androidTabAppearance } from './android-tab-appearance.ts';

/**
 * Each tab names the child route it selects (`path`), which `app.routes.ts` must declare with the
 * same name. iOS draws an SF Symbol, the closest to the design's glyph. Android draws the design's
 * own glyph: a PNG from `assets/icons`, as a template mask the bar tints, because a drawable
 * resource cannot ship through Expo Go.
 */
const TABS = [
  {
    path: 'home',
    title: 'Home',
    sfSymbol: 'house',
    image: require('../../../assets/icons/tab-home.png'),
  },
  {
    path: 'collections',
    title: 'Collections',
    sfSymbol: 'square.stack.3d.up',
    image: require('../../../assets/icons/tab-layers.png'),
  },
  {
    path: 'search',
    title: 'Search',
    sfSymbol: 'magnifyingglass',
    image: require('../../../assets/icons/tab-search.png'),
  },
  {
    path: 'settings',
    title: 'Settings',
    sfSymbol: 'slider.horizontal.3',
    image: require('../../../assets/icons/tab-sliders.png'),
  },
] as const;

/**
 * The app's tab bar: a real tab controller on iOS and a bottom navigation bar on Android. It is the
 * first screen of the root stack, so it has no header of its own; each tab's stack provides one.
 * How the bar looks is set once, in `app.config.ts`.
 */
@Component({
  selector: 'app-tabs',
  imports: [NativeHeader, NativeTab, NativeTabsOutlet],
  template: `
    <native-header [hidden]="true" />
    <native-tabs-outlet>
      @for (tab of tabs; track tab.path) {
        <native-tab
          [path]="tab.path"
          [title]="tab.title"
          [icon]="tab.icon"
          [standardAppearance]="appearance"
          [scrollEdgeAppearance]="appearance"
        />
      }
    </native-tabs-outlet>
  `,
  host: { class: 'screen' },
})
export class Tabs {
  /**
   * Android's tab styling, which has a shape of its own. iOS is styled once for the whole app in
   * `app.config.ts`, so there is nothing to bind there.
   */
  protected readonly appearance =
    nativePlatform() === 'android'
      ? androidTabAppearance((value) => inject(HostEngine).color(value))
      : undefined;

  /** Read when the component is created: the platform is known by then, and not at import. */
  protected readonly tabs = TABS.map(({ path, title, sfSymbol, image }) => ({
    path,
    title,
    icon: (nativePlatform() === 'ios' ? { sfSymbol } : { template: image }) satisfies TabIcon,
  }));
}
