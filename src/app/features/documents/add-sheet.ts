import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Pressable, SafeAreaView, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { ImagePicker } from '@ng-native/expo/image-picker';
import { pressMotion } from '../../shared/motion/press-motion.ts';
import { AddSourceRow } from './add-source-row.ts';

interface AddSource {
  readonly id: 'camera' | 'photos';
  readonly icon: 'camera' | 'photos';
  readonly title: string;
  readonly subtitle: string;
}

/**
 * The design's add sheet (screen 10): a native bottom sheet (`NativeNavigation.present`, not a
 * hand-built overlay), presented from the Home invitation, the floating add button and a
 * collection's empty state.
 *
 * Today it has the two sources `expo-image-picker` can reach. The design's third, "Files", waits
 * for `expo-document-picker` (Phase 6). Picking a photo has nowhere to go yet: there is no document
 * model or storage until Phases 6 and 7, so a successful pick simply closes the sheet, the same as
 * Cancel. A cancelled or refused picker leaves the sheet open to try again.
 */
@Component({
  selector: 'app-add-sheet',
  imports: [AddSourceRow, AnimatedStyle, Pressable, SafeAreaView, Text, View],
  template: `
    <safe-area-view [edges]="['bottom']" class="sheet">
      <text accessibilityRole="header" class="text-heading title">Add to Pockit</text>
      <view class="sources">
        @for (source of sources; track source.id) {
          <app-add-source-row
            [icon]="source.icon"
            [title]="source.title"
            [subtitle]="source.subtitle"
            (select)="choose(source.id)"
          />
        }
      </view>
      <pressable
        accessibilityRole="button"
        [accessibilityLabel]="'Cancel'"
        (pressIn)="press.in()"
        (pressOut)="press.out()"
        (press)="dismiss()"
      >
        <view class="cancel" [animatedStyle]="press.style">
          <text class="text-label text-secondary">Cancel</text>
        </view>
      </pressable>
    </safe-area-view>
  `,
  styles: `
    /* Not ".screen": this native screen is the sheet's own rounded card (its radius comes from
       the native presentation, not CSS), so it is the surface colour, not the app's deep ground. */
    .sheet {
      flex: 1;
      padding: var(--space-sm) var(--space-xl) 0;
      background-color: var(--color-surface);
    }
    .title {
      margin-bottom: var(--space-lg);
    }
    .sources {
      gap: var(--space-sm);
    }
    .cancel {
      align-items: center;
      justify-content: center;
      height: var(--size-control);
      margin-top: var(--space-sm);
    }
  `,
})
export class AddSheet {
  private readonly location = inject(Location);
  private readonly picker = inject(ImagePicker);

  protected readonly sources: readonly AddSource[] = [
    { id: 'camera', icon: 'camera', title: 'Camera', subtitle: 'Take a photo' },
    { id: 'photos', icon: 'photos', title: 'Photos', subtitle: 'Choose from your gallery' },
  ];

  protected readonly press = pressMotion('control');

  protected async choose(id: AddSource['id']): Promise<void> {
    const assets =
      id === 'camera' ? await this.picker.capture() : await this.picker.pick({ mediaTypes: ['images'] });
    if (assets.length === 0) return;
    this.dismiss();
  }

  protected dismiss(): void {
    this.location.back();
  }
}
