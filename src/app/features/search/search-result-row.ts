import { Component, computed, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import type { DocumentPreview } from '../../core/types/document-preview.ts';
import { DocumentThumb } from '../../shared/components/document-thumb/document-thumb.ts';
import { Icon } from '../../shared/components/icon/icon.ts';
import { pressMotion } from '../../shared/motion/press-motion.ts';

/** A title split around the part that matched, for the design's bolded, gold highlight. */
export interface TitleSegment {
  readonly text: string;
  readonly match: boolean;
}

/**
 * One search result (screen 08): a wide thumbnail, the title with the matched substring in the
 * accent colour, and which collection it is in.
 */
@Component({
  selector: 'app-search-result-row',
  imports: [AnimatedStyle, DocumentThumb, Icon, Pressable, Text, View],
  template: `
    <pressable
      accessibilityRole="button"
      [accessibilityLabel]="document().title"
      (pressIn)="press.in()"
      (pressOut)="press.out()"
      (press)="select.emit()"
    >
      <view class="result" [animatedStyle]="press.style">
        <view class="thumb">
          <app-document-thumb [tone]="document().thumbnail.tone" [badge]="document().badge" />
        </view>
        <view class="grow">
          <text class="text-card-heading">
            @for (segment of segments(); track $index) {
              @if (segment.match) {
                <text class="text-accent">{{ segment.text }}</text>
              } @else {
                {{ segment.text }}
              }
            }
          </text>
          <view [class]="'meta collection-' + document().collectionId">
            <view class="dot"></view>
            <text class="text-caption text-tertiary">{{ collectionName() }}</text>
          </view>
        </view>
        <app-icon name="chevron-right" [size]="18" class="muted" />
      </view>
    </pressable>
  `,
  styles: `
    .result {
      flex-direction: row;
      align-items: center;
      gap: var(--space-md);
      height: 84px;
      padding: 0 var(--space-md);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
    }
    .thumb {
      width: 84px;
      flex-shrink: 0;
    }
    .grow {
      flex: 1;
    }
    .meta {
      flex-direction: row;
      align-items: center;
      gap: var(--space-xs);
      margin-top: 2px;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: var(--radius-full);
      background-color: var(--collection-accent);
    }
    .muted {
      --icon-color: var(--color-text-tertiary);
    }
  `,
})
export class SearchResultRow {
  readonly document = input.required<DocumentPreview>();
  readonly collectionName = input.required<string>();
  /** The query it matched, lower-cased: this is the only part that needs it. */
  readonly needle = input.required<string>();
  readonly select = output<void>();

  protected readonly press = pressMotion('card');

  protected readonly segments = computed<readonly TitleSegment[]>(() => {
    const title = this.document().title;
    const needle = this.needle();
    const at = title.toLowerCase().indexOf(needle);
    if (!needle || at < 0) {
      return [{ text: title, match: false }];
    }
    return [
      { text: title.slice(0, at), match: false },
      { text: title.slice(at, at + needle.length), match: true },
      { text: title.slice(at + needle.length), match: false },
    ].filter((segment) => segment.text.length > 0);
  });
}
