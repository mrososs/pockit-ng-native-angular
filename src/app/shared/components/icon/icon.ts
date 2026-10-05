import { Component, computed, input } from '@angular/core';
import { Image, type ImageSource } from '@ng-native/components';
import type { CollectionIconName } from '../../../core/types/collection.ts';

/** Every icon the app draws. Each is a white-on-transparent mask in `assets/icons`. */
export type IconName =
  | CollectionIconName
  | 'chevron-right'
  | 'plus'
  | 'search'
  | 'shield'
  | 'heart'
  | 'camera'
  | 'photos'
  | 'face'
  | 'logo';

const SOURCES: Record<IconName, ImageSource> = {
  'id-card': require('../../../../../assets/icons/id-card.png'),
  award: require('../../../../../assets/icons/award.png'),
  flag: require('../../../../../assets/icons/flag.png'),
  'chevron-right': require('../../../../../assets/icons/chevron-right.png'),
  plus: require('../../../../../assets/icons/plus.png'),
  search: require('../../../../../assets/icons/search.png'),
  shield: require('../../../../../assets/icons/shield.png'),
  heart: require('../../../../../assets/icons/heart.png'),
  camera: require('../../../../../assets/icons/camera.png'),
  photos: require('../../../../../assets/icons/photos.png'),
  face: require('../../../../../assets/icons/face.png'),
  logo: require('../../../../../assets/icons/logo.png'),
};

/**
 * One of the design's line icons, drawn at `size` points in the colour of `--icon-color`.
 *
 * The icon is a mask the engine tints, so its colour comes from the cascade: a parent sets
 * `--icon-color` (to a collection's accent, say) and every icon inside it follows. Left unset it is
 * the secondary text colour. It is decorative: a control that holds one carries the label.
 */
@Component({
  selector: 'app-icon',
  imports: [Image],
  template: `
    <image [source]="source()" [style.width.px]="size()" [style.height.px]="size()" class="glyph" />
  `,
  styles: `
    :host {
      flex-shrink: 0;
    }
    .glyph {
      tint-color: var(--icon-color, var(--color-text-secondary));
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(24);

  protected readonly source = computed(() => SOURCES[this.name()]);
}
