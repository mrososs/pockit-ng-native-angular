import { Component } from '@angular/core';
import { NativeStackOutlet } from '@ng-native/router';

/**
 * The route component of every tab: a native stack of its own. A screen pushed from a tab lands on
 * that tab's stack, with the native header and back gesture, and the tab bar stays where it is.
 */
@Component({
  selector: 'app-tab-stack',
  imports: [NativeStackOutlet],
  template: '<native-stack-outlet />',
  styles: `
    :host {
      flex: 1;
    }
  `,
})
export class TabStack {}
