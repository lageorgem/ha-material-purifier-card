import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityTileFeatureConfig } from '../types';
import { TILE_DEFAULT_PCT } from '../grid';
import type { DisplayOption } from './display-toggle';
import './display-toggle';
import './width-field';
import './icon-field';
import './text-field';
import './color-field';
import './entity-picker';

/** The two entity-tile layouts offered by the display toggle. */
const DISPLAY_OPTIONS: DisplayOption[] = [
  { value: 'icon', label: 'Icon', icon: 'mdi:card-outline' },
  { value: 'tile', label: 'Tile', icon: 'mdi:card-text-outline' },
];

/**
 * Editor for the entity-tile feature. Styled to match the climate/list editors:
 * an Icon/Tile display toggle, the shared width slider, and a single item row
 * with the styled entity picker plus a color pill (tile display only), a custom
 * title, and an icon picker with its "no icon" toggle. Emits `feature-changed`.
 */
export class MpEntityTileEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) feature!: EntityTileFeatureConfig;

  /** The current layout: explicit `display`, else the default tile layout. */
  private get _display(): 'icon' | 'tile' {
    return this.feature.display ?? 'tile';
  }

  /**
   * Merge a patch into the feature config, pruning empty overrides, then emit it.
   * @param patch the fields to set
   */
  private _patch(patch: Partial<EntityTileFeatureConfig>): void {
    const merged: EntityTileFeatureConfig = { ...this.feature, ...patch };
    if (!merged.name) delete merged.name;
    // `undefined` = unset (use the default icon); '' = explicit "no icon" (kept).
    if (merged.icon === undefined) delete merged.icon;
    // undefined/'' color = reset to the default (theme) color.
    if (!merged.color) delete merged.color;
    this.dispatchEvent(
      new CustomEvent('feature-changed', {
        detail: { feature: merged },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render(): TemplateResult {
    const display = this._display;
    // The color pill is offered only in tile display, where it tints the tile.
    const showColor = display === 'tile';
    const defaultIcon = this.hass?.states?.[this.feature.entity]?.attributes?.icon;
    return html`
      <div class="editor">
        <div class="field">
          <span class="field-label">Display</span>
          <mp-display-toggle
            .value=${display}
            .options=${DISPLAY_OPTIONS}
            @value-changed=${(e: CustomEvent) => this._patch({ display: e.detail.value })}
          ></mp-display-toggle>
        </div>

        <mp-width-field
          .hass=${this.hass}
          .value=${this.feature.width}
          .default=${TILE_DEFAULT_PCT}
          @width-changed=${(e: CustomEvent) => this._patch({ width: e.detail.value })}
        ></mp-width-field>

        <div class="item">
          <mp-entity-picker
            .hass=${this.hass}
            .value=${this.feature.entity ?? ''}
            label="Entity"
            .allowCustom=${true}
            @value-changed=${(e: CustomEvent) => this._patch({ entity: e.detail.value })}
          ></mp-entity-picker>
          <div class="row2">
            <div class="title-group">
              ${
                showColor
                  ? html`<mp-color-field
                      .attached=${true}
                      .value=${this.feature.color}
                      @value-changed=${(e: CustomEvent) => this._patch({ color: e.detail.value })}
                    ></mp-color-field>`
                  : nothing
              }
              <mp-text-field
                class="title-field"
                label="Custom title"
                .flatLeft=${showColor}
                .value=${this.feature.name ?? ''}
                @value-changed=${(e: CustomEvent) => this._patch({ name: e.detail.value })}
              ></mp-text-field>
            </div>
            <mp-icon-field
              .hass=${this.hass}
              .value=${this.feature.icon}
              .defaultIcon=${defaultIcon}
              @value-changed=${(e: CustomEvent) => this._patch({ icon: e.detail.value })}
            ></mp-icon-field>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    .field {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .field-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    /* Two lines: the entity picker, then the color pill + title and the icon
       pill below — mirroring the entity-list editor's item. */
    .item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }
    .row2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    /* Color pill + title field attach into a single pill. */
    .title-group {
      display: flex;
      align-items: stretch;
      flex: 1;
      min-width: 0;
    }
    .title-field {
      flex: 1;
      min-width: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-entity-tile-editor': MpEntityTileEditor;
  }
}

if (!customElements.get('mp-entity-tile-editor')) {
  customElements.define('mp-entity-tile-editor', MpEntityTileEditor);
}
