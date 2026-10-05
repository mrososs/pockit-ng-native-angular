import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { required, submit, form, FormField } from '@angular/forms/signals';
import { Image, Pressable, SafeAreaView, Text, TextInput, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { Dialogs } from '@ng-native/device';
import { VaultStore } from '../../core/services/vault-store.ts';
import { VaultFiles } from '../../core/storage/vault-files.ts';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import type { CollectionId } from '../../core/types/collection.ts';
import { Icon } from '../../shared/components/icon/icon.ts';
import { pressMotion } from '../../shared/motion/press-motion.ts';
import { AddDraftStore } from './add-draft.ts';

/**
 * The design's review screen (screen 11): the one place a picked, already-copied file is named,
 * put in a collection, and finally saved - the step Phase 5 and 6 left the add sheet without
 * anywhere to go. Reached by `push`ing on top of the add sheet's own presentation, so Cancel and
 * Save both close two screens, back to wherever opened the add sheet (`dismiss()`).
 *
 * The design's "Add another page" is not built: a document is one file until something gives it a
 * second (the multi-page screen, a later phase).
 */
@Component({
  selector: 'app-review',
  imports: [AnimatedStyle, FormField, Icon, Image, Pressable, SafeAreaView, Text, TextInput, View],
  template: `
    <safe-area-view [edges]="['top', 'bottom']" class="review">
      <view class="head">
        <pressable
          accessibilityRole="button"
          [accessibilityLabel]="'Close'"
          (pressIn)="closePress.in()"
          (pressOut)="closePress.out()"
          (press)="cancel()"
        >
          <view class="close" [animatedStyle]="closePress.style">
            <app-icon name="close" [size]="18" class="closeIcon" />
          </view>
        </pressable>
        <text accessibilityRole="header" class="text-card-heading">Review</text>
        <view class="headSpacer"></view>
      </view>

      <view class="thumb">
        @if (fileType === 'image') {
          <image [source]="{ uri: fileUri }" class="thumbImage" />
        } @else {
          <view class="thumbFile">
            <app-icon name="files" [size]="32" />
          </view>
        }
      </view>

      <text class="text-caption-strong label">Document name</text>
      <text-input [formField]="form.title" class="field" />

      <text class="text-caption-strong label collectionLabel">Collection</text>
      <pressable
        accessibilityRole="button"
        [accessibilityLabel]="'Collection: ' + collectionName()"
        (pressIn)="collectionPress.in()"
        (pressOut)="collectionPress.out()"
        (press)="pickCollection()"
      >
        <view [class]="'collectionField ' + collectionAccentClass()" [animatedStyle]="collectionPress.style">
          <view class="dot"></view>
          <text class="text-label grow">{{ collectionName() }}</text>
          <app-icon name="chevron-right" [size]="18" class="muted" />
        </view>
      </pressable>

      <view class="grow"></view>

      <pressable
        accessibilityRole="button"
        [accessibilityLabel]="'Save to Pockit'"
        [disabled]="form().invalid() || saving()"
        (pressIn)="press.in()"
        (pressOut)="press.out()"
        (press)="save()"
      >
        <view class="save" [animatedStyle]="press.style">
          <text class="text-button">Save to Pockit</text>
        </view>
      </pressable>
      <pressable
        accessibilityRole="button"
        [accessibilityLabel]="'Cancel'"
        (pressIn)="cancelPress.in()"
        (pressOut)="cancelPress.out()"
        (press)="cancel()"
      >
        <view class="cancel" [animatedStyle]="cancelPress.style">
          <text class="text-label text-secondary">Cancel</text>
        </view>
      </pressable>
    </safe-area-view>
  `,
  styles: `
    :host {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    .review {
      flex: 1;
      padding: 0 var(--space-xl) var(--space-xl);
      background-color: var(--color-background);
    }
    .head {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      height: var(--size-tap);
      margin-top: var(--space-md);
    }
    .close {
      align-items: center;
      justify-content: center;
      width: var(--size-tap);
      height: var(--size-tap);
      border-radius: var(--radius-full);
      background-color: var(--color-surface);
    }
    .closeIcon {
      --icon-color: var(--color-text-primary);
    }
    .headSpacer {
      width: var(--size-tap);
    }
    .thumb {
      margin-top: var(--space-lg);
      border-radius: var(--radius-2xl);
      background-color: var(--color-overlay);
      padding: var(--space-lg);
      height: 230px;
    }
    .thumbImage {
      flex: 1;
      border-radius: var(--radius-lg);
    }
    .thumbFile {
      flex: 1;
      align-items: center;
      justify-content: center;
    }
    .label {
      margin-top: var(--space-lg);
    }
    .collectionLabel {
      margin-top: var(--space-lg);
    }
    .field {
      margin-top: var(--space-xs);
      height: var(--size-control);
      padding: 0 var(--space-lg);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
      color: var(--color-text-primary);
    }
    .collectionField {
      margin-top: var(--space-xs);
      flex-direction: row;
      align-items: center;
      gap: var(--space-sm);
      height: var(--size-control);
      padding: 0 var(--space-lg);
      border-radius: var(--radius-lg);
      background-color: var(--color-surface);
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: var(--radius-full);
      background-color: var(--collection-accent);
    }
    .grow {
      flex: 1;
    }
    .muted {
      --icon-color: var(--color-text-tertiary);
    }
    .save {
      align-items: center;
      justify-content: center;
      height: var(--size-control);
      border-radius: var(--radius-lg);
      background-color: var(--color-accent);
    }
    .cancel {
      align-items: center;
      justify-content: center;
      height: var(--size-control);
    }
  `,
})
export class Review {
  private readonly location = inject(Location);
  private readonly dialogs = inject(Dialogs);
  private readonly vaultStore = inject(VaultStore);
  private readonly vaultFiles = inject(VaultFiles);
  private readonly draftStore = inject(AddDraftStore);

  /** Set by the add sheet immediately before it pushes this screen; always present by the time it does. */
  private readonly draft = this.draftStore.current()!;

  protected readonly fileUri = this.draft.fileUri;
  protected readonly fileType = this.draft.fileType;

  protected readonly collections = PREDEFINED_COLLECTIONS;
  protected readonly collectionId = signal<CollectionId>(PREDEFINED_COLLECTIONS[0]!.id);
  protected readonly collectionName = computed(
    () => this.collections.find((collection) => collection.id === this.collectionId())!.name,
  );
  protected readonly collectionAccentClass = computed(() => `collection-${this.collectionId()}`);

  protected readonly model = signal({ title: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.title, { message: 'Give it a name' });
  });

  constructor() {
    this.model.set({ title: this.draft.suggestedTitle });
  }

  protected readonly saving = signal(false);

  protected readonly closePress = pressMotion('round');
  protected readonly collectionPress = pressMotion('control');
  protected readonly press = pressMotion('control');
  protected readonly cancelPress = pressMotion('control');

  protected async pickCollection(): Promise<void> {
    const index = await this.dialogs.choose(
      'Collection',
      this.collections.map((collection) => ({ label: collection.name })),
    );
    if (index !== null) {
      this.collectionId.set(this.collections[index]!.id);
    }
  }

  protected save(): void {
    submit(this.form, async () => {
      this.saving.set(true);
      try {
        await this.vaultStore.save({
          title: this.form.title().value(),
          collectionId: this.collectionId(),
          fileType: this.fileType,
          fileUri: this.fileUri,
        });
        this.dismiss();
      } finally {
        this.saving.set(false);
      }
    });
  }

  protected cancel(): void {
    this.vaultFiles.remove(this.fileUri);
    this.dismiss();
  }

  /** Closes both this screen and the add sheet beneath it, back to wherever opened the add flow. */
  private dismiss(): void {
    this.draftStore.clear();
    this.location.back();
    this.location.back();
  }
}
