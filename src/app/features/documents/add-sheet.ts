import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Pressable, SafeAreaView, ScrollView, Text, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { DocumentPicker } from '@ng-native/expo/document-picker';
import { ImagePicker } from '@ng-native/expo/image-picker';
import { NativeNavigation } from '@ng-native/router';
import { VaultFiles } from '../../core/storage/vault-files.ts';
import { fileTypeOf } from '../../core/types/document-item.ts';
import { pressMotion } from '../../shared/motion/press-motion.ts';
import { AddDraftStore } from './add-draft.ts';
import { AddSourceRow } from './add-source-row.ts';

type SourceId = 'camera' | 'photos' | 'files';

interface AddSource {
  readonly id: SourceId;
  readonly icon: SourceId;
  readonly title: string;
  readonly subtitle: string;
}

/**
 * The design's add sheet (screen 10): a native bottom sheet (`NativeNavigation.present`, not a
 * hand-built overlay), presented from the Home invitation, the floating add button and a
 * collection's empty state.
 *
 * All three of the design's sources pick something and copy it into the vault's own storage
 * (`VaultFiles`, Phase 6's copy-not-reference decision), then `push` the Review screen on top of
 * this one, where it is named, put in a collection, and saved (Phase 7). A cancelled or refused
 * picker, or a copy that fails, leaves the sheet open to try again instead.
 */
@Component({
  selector: 'app-add-sheet',
  imports: [AddSourceRow, AnimatedStyle, Pressable, SafeAreaView, ScrollView, Text, View],
  template: `
    <safe-area-view [edges]="['bottom']" class="sheet">
      <scroll-view [showsVerticalScrollIndicator]="false" class="fill">
        <view class="content">
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
        </view>
      </scroll-view>
    </safe-area-view>
  `,
  styles: `
    /* Not ".screen": this native screen is the sheet's own rounded card (its radius comes from
       the native presentation, not CSS), so it is the surface colour, not the app's deep ground. */
    .sheet {
      flex: 1;
      background-color: var(--color-surface);
    }
    .fill {
      flex: 1;
    }
    /*
     * A fixed-fraction detent (addSheetPresentation.detent) is a fraction of the SCREEN, but
     * this content's height is fixed in points; on a shorter screen, or one whose 3-button nav
     * bar eats more of the bottom safe area than a gesture-nav device's does, the same fraction
     * is fewer points and Cancel can run past the sheet's own bottom edge. A device with
     * 3-button navigation and a shorter screen than the one this was checked on is exactly where
     * that was caught: the sheet clipped Cancel instead of scrolling to it. A scroll view costs
     * nothing where everything already fits (its content is shorter than the viewport, so it
     * never actually scrolls) and is the one place content can still be reached where it does not.
     */
    .content {
      padding: var(--space-sm) var(--space-xl) var(--space-lg);
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
  private readonly nav = inject(NativeNavigation);
  private readonly imagePicker = inject(ImagePicker);
  private readonly documentPicker = inject(DocumentPicker);
  private readonly vaultFiles = inject(VaultFiles);
  private readonly draft = inject(AddDraftStore);

  protected readonly sources: readonly AddSource[] = [
    { id: 'camera', icon: 'camera', title: 'Camera', subtitle: 'Take a photo' },
    { id: 'photos', icon: 'photos', title: 'Photos', subtitle: 'Choose from your gallery' },
    { id: 'files', icon: 'files', title: 'Files', subtitle: 'Choose PDF or document' },
  ];

  protected readonly press = pressMotion('control');

  protected async choose(id: SourceId): Promise<void> {
    const picked = await this.pick(id);
    if (!picked) {
      return;
    }
    let vaultUri: string;
    try {
      vaultUri = await this.vaultFiles.copy(picked.uri, {
        mimeType: picked.mimeType,
        originalName: picked.originalName,
      });
    } catch {
      return; // The copy failed; stay open, the same as a cancelled picker.
    }
    this.draft.set({
      fileUri: vaultUri,
      fileType: fileTypeOf(picked.mimeType),
      suggestedTitle: titleOf(picked.originalName),
    });
    void this.nav.push(['/add-review']);
  }

  protected dismiss(): void {
    this.location.back();
  }

  private async pick(id: SourceId): Promise<Picked | null> {
    if (id === 'files') {
      const [file] = await this.documentPicker.pick({ type: '*/*' });
      return file ? { uri: file.uri, mimeType: file.mimeType, originalName: file.name } : null;
    }
    if (id === 'camera') {
      const [asset] = await this.imagePicker.capture();
      // A fresh capture's `fileName` is the camera's own generated id, not a name a person chose
      // or would recognise, so it is not carried through as Review's suggested title. The vault
      // copy still gets the right extension, from the mime type instead.
      return asset ? { uri: asset.uri, mimeType: asset.mimeType, originalName: null } : null;
    }
    const [asset] = await this.imagePicker.pick({ mediaTypes: ['images'] });
    return asset ? { uri: asset.uri, mimeType: asset.mimeType, originalName: asset.fileName } : null;
  }
}

/** What either picker hands back, reduced to what `VaultFiles.copy` needs. */
interface Picked {
  readonly uri: string;
  readonly mimeType?: string | null;
  readonly originalName?: string | null;
}

/** A name without its extension, for Review's name field. Empty if the picker gave none (the camera). */
function titleOf(originalName: string | null | undefined): string {
  return originalName?.replace(/\.[a-zA-Z0-9]+$/, '') ?? '';
}
