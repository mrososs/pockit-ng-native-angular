import { Component, input } from '@angular/core';
import { Text } from '@ng-native/components';

/** The heading of a section of a page: "Quick Access", "Suggested collections". */
@Component({
  selector: 'app-section-header',
  imports: [Text],
  template: `<text accessibilityRole="header" class="text-section-title">{{ title() }}</text>`,
})
export class SectionHeader {
  readonly title = input.required<string>();
}
