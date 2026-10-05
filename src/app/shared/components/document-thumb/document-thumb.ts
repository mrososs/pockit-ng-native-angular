import { Component, computed, input } from '@angular/core';
import { Text, View } from '@ng-native/components';
import type { ThumbnailTone } from '../../../core/types/document-preview.ts';
import { Icon } from '../icon/icon.ts';

/**
 * A document's thumbnail: the design's placeholder artwork, a redacted page on a coloured ground, at
 * a 3:2 ratio. A badge sits bottom-left (a page count, "PDF") and a heart top-right for a favourite.
 *
 * The tones are artwork, not interface colours, so they live here rather than in the design tokens.
 * Real thumbnails replace the artwork once documents carry images.
 */
@Component({
  selector: 'app-document-thumb',
  imports: [Icon, Text, View],
  template: `
    <view [class]="thumbClass()">
      <view class="mark portrait"></view>
      <view class="mark line-title"></view>
      <view class="mark line-a"></view>
      <view class="mark line-b"></view>
      <view class="mark line-foot"></view>
      @if (badge(); as label) {
        <view class="chip badge">
          <text class="text-badge">{{ label }}</text>
        </view>
      }
      @if (favorite()) {
        <view class="chip heart">
          <app-icon name="heart" [size]="14" />
        </view>
      }
    </view>
  `,
  styles: `
    .thumb {
      width: 100%;
      aspect-ratio: 1.5;
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .tone-indigo {
      background-image: linear-gradient(135deg, #3f4c94, #6d63b8);
      --thumb-ink: #e8e6ff;
    }
    .tone-teal {
      background-image: linear-gradient(135deg, #2f6f78, #4aa0a0);
      --thumb-ink: #e3f6f4;
    }
    .tone-rose {
      background-image: linear-gradient(135deg, #5a2f42, #8a4d63);
      --thumb-ink: #fbe6ec;
    }
    .tone-paper {
      background-color: #e4ddcb;
      --thumb-ink: #3a3a36;
    }
    .tone-sky {
      background-image: linear-gradient(135deg, #2c5a7a, #4a86a8);
      --thumb-ink: #e4f2fa;
    }
    .tone-ochre {
      background-image: linear-gradient(135deg, #6b5b2f, #9c8548);
      --thumb-ink: #fff3d0;
    }
    .mark {
      position: absolute;
      border-radius: 4px;
      background-color: var(--thumb-ink);
    }
    .portrait {
      left: 9%;
      top: 26%;
      width: 26%;
      aspect-ratio: 1;
      border-radius: var(--radius-full);
      opacity: 0.5;
    }
    .line-title {
      left: 43%;
      top: 26%;
      width: 44%;
      height: 7%;
      opacity: 0.55;
    }
    .line-a {
      left: 43%;
      top: 42%;
      width: 34%;
      height: 6%;
      opacity: 0.35;
    }
    .line-b {
      left: 43%;
      top: 56%;
      width: 40%;
      height: 6%;
      opacity: 0.35;
    }
    .line-foot {
      left: 9%;
      top: 76%;
      width: 60%;
      height: 5%;
      opacity: 0.25;
    }
    .chip {
      position: absolute;
      align-items: center;
      justify-content: center;
      background-color: var(--color-overlay);
    }
    .badge {
      left: var(--space-sm);
      bottom: var(--space-sm);
      height: 20px;
      padding: 0 var(--space-sm);
      border-radius: 10px;
    }
    .heart {
      right: var(--space-sm);
      top: var(--space-sm);
      width: 26px;
      height: 26px;
      border-radius: var(--radius-full);
    }
    .heart app-icon {
      --icon-color: var(--color-favorite);
    }
  `,
})
export class DocumentThumb {
  readonly tone = input.required<ThumbnailTone>();
  readonly badge = input<string>();
  readonly favorite = input(false);

  protected readonly thumbClass = computed(() => `thumb tone-${this.tone()}`);
}
