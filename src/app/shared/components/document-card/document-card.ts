import { Component, computed, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import type { DocumentPreview } from '../../../core/types/document-preview.ts';
import { pressMotion } from '../../motion/press-motion.ts';
import { DocumentThumb } from '../document-thumb/document-thumb.ts';

/** A document in a row or a grid: its thumbnail, its title and what it is. Sized by its parent. */
@Component({
  selector: 'app-document-card',
  imports: [AnimatedStyle, DocumentThumb, Pressable, Text, View],
  template: `
    <pressable
      accessibilityRole="button"
      [accessibilityLabel]="label()"
      (pressIn)="press.in()"
      (pressOut)="press.out()"
      (press)="open.emit(document())"
    >
      <view [animatedStyle]="press.style">
        <app-document-thumb
          [tone]="document().thumbnail.tone"
          [badge]="document().badge"
          [favorite]="document().favorite"
        />
        <text class="text-item-title title">{{ document().title }}</text>
        <text class="text-caption kind">{{ document().kind }}</text>
      </view>
    </pressable>
  `,
  styles: `
    .title {
      margin-top: var(--space-sm);
      white-space: nowrap;
    }
    .kind {
      white-space: nowrap;
    }
  `,
})
export class DocumentCard {
  readonly document = input.required<DocumentPreview>();
  readonly open = output<DocumentPreview>();

  protected readonly press = pressMotion('card');
  protected readonly label = computed(() => `${this.document().title}, ${this.document().kind}`);
}
