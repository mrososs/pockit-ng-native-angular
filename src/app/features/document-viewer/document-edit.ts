import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { required, submit, form, FormField } from '@angular/forms/signals';
import { Pressable, SafeAreaView, Text, TextInput, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { Dialogs } from '@ng-native/device';
import { DocumentViewerStore } from '../../core/services/document-viewer-store.ts';
import { VaultStore } from '../../core/services/vault-store.ts';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import type { CollectionId } from '../../core/types/collection.ts';
import { Icon } from '../../shared/components/icon/icon.ts';
import { pressMotion } from '../../shared/motion/press-motion.ts';

/**
 * The document viewer's "Edit" (Phase 11): the one place a saved document's name and collection
 * can be changed. Pushed on top of the viewer the same way Review is pushed on top of the add
 * sheet, so one `location.back()` returns to it.
 *
 * Not a photo or PDF editor: the file itself (`fileUri`, `fileType`) is never touched, only the
 * row that points at it. Closely mirrors Review's own name-field-and-collection-picker shape,
 * deliberately - the same two pieces of information, the same way of changing them - but saves an
 * existing document (`VaultStore.update`) rather than a new one (`VaultStore.save`), and so does
 * not own a file to delete if it is cancelled.
 */
@Component({
  selector: 'app-document-edit',
  imports: [AnimatedStyle, FormField, Icon, Pressable, SafeAreaView, Text, TextInput, View],
  template: `
    <safe-area-view [edges]="['top', 'bottom']" class="edit">
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
        <text accessibilityRole="header" class="text-card-heading">Edit Document</text>
        <view class="headSpacer"></view>
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
        [accessibilityLabel]="'Save changes'"
        [disabled]="form().invalid() || saving()"
        (pressIn)="press.in()"
        (pressOut)="press.out()"
        (press)="save()"
      >
        <view class="save" [animatedStyle]="press.style">
          <text class="text-button">Save changes</text>
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
    .edit {
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
    .label {
      margin-top: var(--space-2xl);
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
export class DocumentEdit {
  private readonly location = inject(Location);
  private readonly dialogs = inject(Dialogs);
  private readonly vaultStore = inject(VaultStore);
  private readonly documentStore = inject(DocumentViewerStore);

  /** Set by the viewer immediately before it pushes this screen; always present by the time it does. */
  private readonly item = this.documentStore.current()!;

  protected readonly collections = PREDEFINED_COLLECTIONS;
  protected readonly collectionId = signal<CollectionId>(this.item.collectionId);
  protected readonly collectionName = computed(
    () => this.collections.find((collection) => collection.id === this.collectionId())!.name,
  );
  protected readonly collectionAccentClass = computed(() => `collection-${this.collectionId()}`);

  protected readonly model = signal({ title: this.item.title });
  protected readonly form = form(this.model, (path) => {
    required(path.title, { message: 'Give it a name' });
  });

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
        const title = this.form.title().value();
        const collectionId = this.collectionId();
        await this.vaultStore.update(this.item.id, { title, collectionId });
        this.documentStore.replace({ ...this.item, title, collectionId });
        this.location.back();
      } finally {
        this.saving.set(false);
      }
    });
  }

  protected cancel(): void {
    this.location.back();
  }
}
