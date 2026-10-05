import { Component } from '@angular/core';
import type { SheetWithFonts } from '@ng-native/expo/fonts';
import { type StyleSheet, styleSheetOf } from '@ng-native/fabric';

/**
 * Carries `global.css`, the design system's stylesheet. It is never rendered: Ng Native compiles a
 * component's `styleUrl` into a sheet attached to the class, and `globalStyleSheet()` hands that
 * sheet to `mount()` as `globalStyles` (and to `loadFonts()`), which is the one sheet that matches
 * a node whichever component made it.
 */
@Component({
  selector: 'app-global-styles',
  template: '',
  styleUrl: './global.css',
})
export class GlobalStyles {}

/**
 * The compiled design-system stylesheet, for `mount()`, `loadFonts()` and for tests.
 *
 * The compiler puts the faces a sheet declares on it as `fonts`, which `loadFonts()` reads. The
 * framework's `StyleSheet` type does not declare that property yet, so it is added to the type here.
 */
export function globalStyleSheet(): (StyleSheet & SheetWithFonts) | null {
  return styleSheetOf(GlobalStyles);
}
