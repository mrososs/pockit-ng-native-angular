import { Component, computed, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import type { CollectionDefinition } from '../../../core/types/collection.ts';
import type { ThumbnailSource } from '../../../core/types/document-preview.ts';
import { pressMotion } from '../../motion/press-motion.ts';
import { documentCountLabel } from '../../utils/count-label.ts';
import { DocumentThumb } from '../document-thumb/document-thumb.ts';
import { Icon } from '../icon/icon.ts';

/**
 * The four forms of a collection card in the design:
 *
 * - `primary`: tall, on the collection's own surface, with its count at the foot and, when it has
 *   documents, two of them peeking out of the corner. Home.
 * - `featured`: the same card as one wide row. The head of the Collections page.
 * - `secondary`: a square-ish tile on the neutral surface, two to a row.
 * - `compact`: one row, for lists.
 */
export type CollectionCardVariant = 'primary' | 'featured' | 'secondary' | 'compact';

/**
 * A collection as a card. Its accent (icon tile, count) is the collection's own, which the host
 * takes from the cascade by carrying `.collection-<id>`, so nothing here names a colour.
 */
@Component({
  selector: 'app-collection-card',
  imports: [AnimatedStyle, DocumentThumb, Icon, Pressable, Text, View],
  host: { '[class]': 'accentClass()' },
  template: `
    <pressable
      accessibilityRole="button"
      [accessibilityLabel]="label()"
      (pressIn)="press.in()"
      (pressOut)="press.out()"
      (press)="open.emit(collection())"
    >
      <view [class]="cardClass()" [animatedStyle]="press.style">
        @switch (variant()) {
          @case ('primary') {
            <view class="tile tile-lg">
              <app-icon [name]="collection().icon" [size]="24" />
            </view>
            <view [class]="copyClass()">
              <text class="text-card-title">{{ collection().name }}</text>
              <text class="text-body-secondary">{{ collection().description }}</text>
            </view>
            <view class="footer">
              <text class="text-caption-strong text-collection">{{ countLabel() }}</text>
              <app-icon name="chevron-right" [size]="18" />
            </view>
            @if (peek()[0]; as back) {
              <view class="peek peek-back">
                <app-document-thumb [tone]="back.tone" />
              </view>
            }
            @if (peek()[1]; as front) {
              <view class="peek peek-front">
                <app-document-thumb [tone]="front.tone" />
              </view>
            }
          }
          @case ('featured') {
            <view class="tile tile-lg">
              <app-icon [name]="collection().icon" [size]="24" />
            </view>
            <view class="grow">
              <text class="text-row-title">{{ collection().name }}</text>
              <text class="text-body-secondary">{{ featuredMeta() }}</text>
            </view>
            <app-icon name="chevron-right" [size]="18" />
          }
          @case ('secondary') {
            <view class="tile tile-sm">
              <app-icon [name]="collection().icon" [size]="20" />
            </view>
            <text class="text-card-heading name">{{ collection().name }}</text>
            <text class="text-caption">{{ countLabel() }}</text>
            @if (chevron()) {
              <app-icon name="chevron-right" [size]="18" class="corner muted" />
            }
          }
          @case ('compact') {
            <view class="tile tile-sm">
              <app-icon [name]="collection().icon" [size]="20" />
            </view>
            <view class="grow">
              <text class="text-card-heading">{{ collection().name }}</text>
              <text class="text-caption">{{ collection().description }}</text>
            </view>
            <app-icon name="chevron-right" [size]="18" class="muted" />
          }
        }
      </view>
    </pressable>
  `,
  styles: `
    .primary {
      min-height: 156px;
      justify-content: space-between;
      padding: var(--space-xl);
      border-radius: var(--radius-2xl);
      background-color: var(--collection-surface);
    }
    .featured {
      flex-direction: row;
      align-items: center;
      gap: var(--space-lg);
      min-height: 96px;
      padding: 0 var(--space-xl);
      border-radius: var(--radius-2xl);
      background-color: var(--collection-surface);
    }
    .secondary {
      min-height: 112px;
      padding: var(--space-lg);
      border-radius: var(--radius-xl);
      background-color: var(--color-surface);
    }
    .compact {
      flex-direction: row;
      align-items: center;
      gap: var(--space-md);
      min-height: 64px;
      padding: 0 var(--space-lg);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
    }

    .tile {
      align-items: center;
      justify-content: center;
      background-color: var(--collection-tint);
    }
    .tile-sm {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
    }
    .tile-lg {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
    }
    .tile app-icon {
      --icon-color: var(--collection-accent);
    }

    .grow {
      flex: 1;
    }
    .peeked {
      max-width: 70%;
    }
    .name {
      margin-top: var(--space-md);
    }
    .footer {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .corner {
      position: absolute;
      top: var(--space-xl);
      right: var(--space-lg);
    }
    .muted {
      --icon-color: var(--color-text-tertiary);
    }

    .peek {
      position: absolute;
      width: 92px;
    }
    .peek-back {
      top: var(--space-xl);
      right: var(--space-xl);
      transform: rotate(-7deg);
      opacity: 0.7;
    }
    .peek-front {
      top: 34px;
      right: var(--space-md);
      transform: rotate(6deg);
    }
  `,
})
export class CollectionCard {
  readonly collection = input.required<CollectionDefinition>();
  readonly variant = input<CollectionCardVariant>('secondary');
  /** How many documents it holds. */
  readonly count = input(0);
  /** Thumbnails to peek out of a `primary` card. Two at most are drawn. */
  readonly peek = input<readonly ThumbnailSource[]>([]);
  /** A chevron in the corner of a `secondary` card. */
  readonly chevron = input(false);
  readonly open = output<CollectionDefinition>();

  /**
   * The pressable is the touch target and holds still; the card inside it is what dips. A half-width
   * tile dips as a card does, the wide ones (which would move a lot of pixels at the same scale) as
   * a surface does.
   */
  protected readonly press = pressMotion(() => (this.variant() === 'secondary' ? 'card' : 'surface'));

  protected readonly accentClass = computed(() => `collection-${this.collection().id}`);
  protected readonly cardClass = computed(() => `card ${this.variant()}`);
  protected readonly copyClass = computed(() => (this.peek().length > 0 ? 'peeked' : ''));
  protected readonly countLabel = computed(() => documentCountLabel(this.count()));
  protected readonly label = computed(() => `${this.collection().name}, ${this.countLabel()}`);

  /** The featured row's second line: what it holds, and how many once it holds any. */
  protected readonly featuredMeta = computed(() =>
    this.count() > 0
      ? `${this.collection().description} · ${this.count()}`
      : this.collection().description,
  );
}
