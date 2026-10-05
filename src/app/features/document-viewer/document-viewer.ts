import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Image, Pressable, SafeAreaView, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { NativeGesture } from '@ng-native/components/gestures';
import { sharedValue, workletStyle, WorkletStyle } from '@ng-native/components/reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, withTiming } from 'react-native-reanimated';
import { DocumentViewerStore } from '../../core/services/document-viewer-store.ts';
import { Sharing } from '../../core/services/sharing.ts';
import { VaultStore } from '../../core/services/vault-store.ts';
import { Icon } from '../../shared/components/icon/icon.ts';
import { pressMotion } from '../../shared/motion/press-motion.ts';
import { motion } from '../../shared/theme/theme.ts';

/**
 * The design's document viewer (screen 06), for an image - this app renders no PDF of its own
 * (`DocumentViewerStore`'s own choice, Phase 9): pinch to zoom between the design's bounds, double
 * tap to the middle of them, and a vertical drag that is far enough reads as "let go of this"
 * rather than a wobble.
 *
 * Multi-page documents do not exist yet (Review's "one file per document" docstring), so the
 * design's page dots and the second thumbnail peeking off the edge are not built: there is never a
 * second page to show.
 *
 * Reached by `NativeNavigation.present(['/document'], { as: 'fullScreenModal' })`, which carries no
 * drag-to-dismiss of its own (unlike a sheet); the swipe down is this screen's own gesture, not the
 * platform's.
 */
@Component({
  selector: 'app-document-viewer',
  imports: [AnimatedStyle, Icon, Image, NativeGesture, Pressable, SafeAreaView, Text, View, WorkletStyle],
  template: `
    <safe-area-view [edges]="['top', 'bottom']" class="fill">
    <view class="viewer" [workletStyle]="dismissStyle">
      <view class="head">
        <pressable
          accessibilityRole="button"
          [accessibilityLabel]="'Close'"
          (pressIn)="press.in()"
          (pressOut)="press.out()"
          (press)="close()"
        >
          <view class="closeTile" [animatedStyle]="press.style">
            <app-icon name="close" [size]="20" class="onDark" />
          </view>
        </pressable>
        <view class="titleBlock">
          <text class="text-label" [numberOfLines]="1">{{ item.title }}</text>
          <text class="text-caption text-tertiary">{{ item.kind }}</text>
        </view>
        <view class="headSpacer"></view>
      </view>

      <view class="stage" testID="viewer-stage" [gesture]="gesture">
        <image [source]="{ uri: item.fileUri }" resizeMode="contain" class="image" [workletStyle]="imageStyle" />
      </view>

      <view class="actions">
        <pressable
          accessibilityRole="button"
          [accessibilityLabel]="favorite() ? 'Remove from favourites' : 'Add to favourites'"
          (pressIn)="favoritePress.in()"
          (pressOut)="favoritePress.out()"
          (press)="toggleFavorite()"
        >
          <view class="action" [animatedStyle]="favoritePress.style">
            <view class="actionTile">
              <app-icon name="heart" [size]="24" [class]="favorite() ? 'onDark favorite' : 'onDark'" />
            </view>
            <text class="text-caption text-tertiary">{{ favorite() ? 'Favourited' : 'Favourite' }}</text>
          </view>
        </pressable>
        <pressable
          accessibilityRole="button"
          [accessibilityLabel]="'Share'"
          (pressIn)="sharePress.in()"
          (pressOut)="sharePress.out()"
          (press)="share()"
        >
          <view class="action" [animatedStyle]="sharePress.style">
            <view class="actionTile">
              <app-icon name="share" [size]="24" class="onDark" />
            </view>
            <text class="text-caption text-tertiary">Share</text>
          </view>
        </pressable>
      </view>
    </view>
    </safe-area-view>
  `,
  styles: `
    .fill {
      flex: 1;
    }
    .viewer {
      flex: 1;
      background-color: var(--color-viewer-ground);
    }
    .head {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      height: var(--size-tap);
      padding: 0 var(--space-sm);
      margin-top: var(--space-sm);
    }
    .closeTile {
      align-items: center;
      justify-content: center;
      width: var(--size-tap);
      height: var(--size-tap);
    }
    .titleBlock {
      align-items: center;
    }
    .headSpacer {
      width: var(--size-tap);
    }
    .stage {
      flex: 1;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl);
    }
    .image {
      width: 100%;
      height: 100%;
    }
    .actions {
      flex-direction: row;
      justify-content: center;
      gap: var(--space-3xl);
      padding-bottom: var(--space-xl);
    }
    .action {
      align-items: center;
      gap: var(--space-xs);
    }
    .actionTile {
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: var(--radius-full);
      background-color: var(--color-overlay);
    }
    .onDark {
      --icon-color: var(--color-text-primary);
    }
    .favorite {
      --icon-color: var(--color-favorite);
    }
  `,
})
export class DocumentViewer {
  private readonly location = inject(Location);
  private readonly documentStore = inject(DocumentViewerStore);
  private readonly vaultStore = inject(VaultStore);
  private readonly sharing = inject(Sharing);

  /** Set by whatever opened the viewer, immediately before presenting it; always present by then. */
  protected readonly item = this.documentStore.current()!;
  protected readonly favorite = signal(this.item.favorite);

  protected readonly press = pressMotion('round');
  protected readonly favoritePress = pressMotion('control');
  protected readonly sharePress = pressMotion('control');

  private readonly scale = sharedValue<number>(motion.viewer.minScale);
  private readonly savedScale = sharedValue<number>(motion.viewer.minScale);
  private readonly translateX = sharedValue(0);
  private readonly translateY = sharedValue(0);
  private readonly savedTranslateX = sharedValue(0);
  private readonly savedTranslateY = sharedValue(0);
  private readonly dismissY = sharedValue(0);

  protected readonly imageStyle = workletStyle(
    [this.scale, this.translateX, this.translateY],
    (scale, translateX, translateY) => {
      'worklet';
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
      };
    },
  );

  protected readonly dismissStyle = workletStyle([this.dismissY], (dismissY) => {
    'worklet';
    const progress = dismissY.value / motion.viewer.dismissDistance;
    return {
      transform: [{ translateY: dismissY.value }],
      opacity: 1 - Math.min(progress, 1) * 0.6,
    };
  });

  protected readonly gesture = (() => {
    // Read through locals, never `this`: a gesture's callbacks run as worklets, on the UI thread,
    // where there is no component instance (`@ng-native/components/gestures`'s own docstring).
    const { minScale, maxScale, doubleTapScale, dismissDistance } = motion.viewer;
    const scale = this.scale;
    const savedScale = this.savedScale;
    const translateX = this.translateX;
    const translateY = this.translateY;
    const savedTranslateX = this.savedTranslateX;
    const savedTranslateY = this.savedTranslateY;
    const dismissY = this.dismissY;
    const close = () => this.close();

    const pinch = Gesture.Pinch()
      .onUpdate((event) => {
        'worklet';
        scale.value = Math.min(Math.max(savedScale.value * event.scale, minScale), maxScale);
      })
      .onEnd(() => {
        'worklet';
        savedScale.value = scale.value;
      });

    const pan = Gesture.Pan()
      .onUpdate((event) => {
        'worklet';
        if (scale.value > minScale) {
          translateX.value = savedTranslateX.value + event.translationX;
          translateY.value = savedTranslateY.value + event.translationY;
        } else {
          dismissY.value = Math.max(event.translationY, 0);
        }
      })
      .onEnd(() => {
        'worklet';
        if (scale.value > minScale) {
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
          return;
        }
        if (dismissY.value > dismissDistance) {
          runOnJS(close)();
          return;
        }
        dismissY.value = withTiming(0);
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        'worklet';
        if (scale.value > minScale) {
          scale.value = withTiming(minScale);
          savedScale.value = minScale;
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        } else {
          scale.value = withTiming(doubleTapScale);
          savedScale.value = doubleTapScale;
        }
      });

    return Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));
  })();

  protected close(): void {
    this.documentStore.clear();
    this.location.back();
  }

  protected toggleFavorite(): void {
    const next = !this.favorite();
    this.favorite.set(next);
    void this.vaultStore.setFavorite(this.item.id, next);
  }

  protected share(): void {
    void this.sharing.share(this.item.fileUri);
  }
}
