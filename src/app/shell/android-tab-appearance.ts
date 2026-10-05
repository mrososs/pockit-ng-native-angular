import type { TabAppearance } from '@ng-native/router';
import { nativeChrome, palette } from '../shared/theme/theme.ts';

/**
 * How Android's bottom navigation is styled. It is not the shape iOS takes: the tab screen reads its
 * appearance flat, with `normal` and `selected` at the top, plus Android's own options. Ng Native
 * 0.1.2 types the iOS shape (`stacked`, `inline`) only and passes the rest through untouched, so this
 * builds the Android one and hands it over as a `TabAppearance`.
 *
 * Colours inside the nested `normal` and `selected` are not converted for native by the wrapper, and
 * a raw hex string reaching Android crashes the screen, so each one goes through `color`, the
 * engine's own converter.
 *
 * What it does against the design:
 * - the bar is the chrome surface;
 * - an idle tab is tertiary, a selected one the accent, icon and label alike;
 * - no active-indicator pill behind the selected icon (the design has none);
 * - a label under every tab, where Material shows only the selected one once there are four;
 * - the labels in the design's font at 11.
 *
 * What it cannot do: the design's hairline above the bar. Android's bar has no such prop.
 */
export interface AndroidTabAppearance {
  readonly tabBarBackgroundColor: unknown;
  readonly tabBarItemActiveIndicatorEnabled: boolean;
  readonly tabBarItemLabelVisibilityMode: 'labeled';
  readonly tabBarItemTitleFontFamily: string;
  readonly tabBarItemTitleSmallLabelFontSize: number;
  readonly tabBarItemTitleLargeLabelFontSize: number;
  readonly normal: ItemColours;
  readonly selected: ItemColours;
}

interface ItemColours {
  readonly tabBarItemIconColor: unknown;
  readonly tabBarItemTitleFontColor: unknown;
}

export function androidTabAppearance(color: (value: string) => unknown): TabAppearance {
  const appearance: AndroidTabAppearance = {
    tabBarBackgroundColor: color(palette.chrome),
    tabBarItemActiveIndicatorEnabled: false,
    tabBarItemLabelVisibilityMode: 'labeled',
    tabBarItemTitleFontFamily: nativeChrome.tabBar.labelFontFamily,
    tabBarItemTitleSmallLabelFontSize: nativeChrome.tabBar.labelFontSize,
    tabBarItemTitleLargeLabelFontSize: nativeChrome.tabBar.labelFontSize,
    normal: {
      tabBarItemIconColor: color(palette.textTertiary),
      tabBarItemTitleFontColor: color(palette.textTertiary),
    },
    selected: {
      tabBarItemIconColor: color(palette.accent),
      tabBarItemTitleFontColor: color(palette.accent),
    },
  };
  // The wrapper's type describes iOS; the object is what Android's tab screen reads.
  return appearance as unknown as TabAppearance;
}
