import { css } from 'lit';

/**
 * Shared "tile" styling used by both the selector dropdown's tile variant
 * ({@link ../features/dropdown.MpDropdown}) and the entity tile feature
 * ({@link ../features/entity-tile.MpEntityTile}), so the two look identical.
 *
 * A tile is a full-width button with a leading icon chip and a title over its
 * value. The `on` class drives the "active" treatment — extra-rounded corners
 * plus a soft tint of `--mp-tile-accent` (the HVAC mode color for climate
 * selectors, else the primary) — while an "off" tile stays a squarer, neutral
 * surface. The title is intentionally smaller/dimmer than the value, matching
 * the Google Home tiles.
 */
export const tileStyles = css`
  .tile {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    /* 40px icon chip + 24px vertical padding = 64px. Capped title/value
       line-heights keep the text shorter than the chip, so every tile variant
       (full, icon-only, and the dropdown/climate tiles) lands on the same 64px
       height and lines up in a mixed feature row. */
    min-height: 64px;
    box-sizing: border-box;
    border: none;
    /* "off" tiles are squarer rounded rectangles; "on" tiles morph to the
       extra-rounded card shape (see the .tile.on rule below). */
    border-radius: var(--mp-shape-chip-square);
    background: var(--mp-surface-container);
    color: var(--mp-on-surface);
    cursor: pointer;
    font: inherit;
    text-align: left;
    transition:
      background-color 200ms cubic-bezier(0.2, 0, 0, 1),
      border-radius 260ms cubic-bezier(0.2, 0, 0, 1),
      color 200ms cubic-bezier(0.2, 0, 0, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .tile:hover {
    background: color-mix(in srgb, var(--mp-on-surface) 6%, var(--mp-surface-container));
  }
  .tile:active {
    background: color-mix(in srgb, var(--mp-on-surface) 12%, var(--mp-surface-container));
  }
  .tile.on {
    /* extra-rounded corners + a soft tint of the accent (the HVAC mode color
       for the climate selector, else the primary). */
    border-radius: var(--mp-shape-card);
    background: color-mix(
      in srgb,
      var(--mp-tile-accent, var(--mp-primary)) 16%,
      var(--mp-surface-container)
    );
    color: var(--mp-tile-accent, var(--mp-primary));
  }
  .tile.on:hover {
    background: color-mix(
      in srgb,
      var(--mp-tile-accent, var(--mp-primary)) 22%,
      var(--mp-surface-container)
    );
  }
  .tile .ic {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: var(--mp-shape-full);
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--mp-on-surface-variant) 14%, transparent);
    color: var(--mp-on-surface-variant);
    transition:
      background-color 200ms cubic-bezier(0.2, 0, 0, 1),
      color 200ms cubic-bezier(0.2, 0, 0, 1);
  }
  .tile.on .ic {
    background: color-mix(in srgb, var(--mp-tile-accent, var(--mp-primary)) 26%, transparent);
    color: var(--mp-tile-accent, var(--mp-primary));
  }
  .tile .ic ha-icon {
    --mdc-icon-size: 22px;
  }
  .tile .ic .dot {
    background: currentColor;
  }
  .tile .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .tile .title {
    font-size: var(--md-sys-typescale-label-medium-size, 13px);
    line-height: 1.2;
    font-weight: 500;
    color: var(--mp-on-surface-variant);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tile.on .title {
    color: currentColor;
  }
  .tile .value {
    font-size: var(--md-sys-typescale-body-large-size, 16px);
    line-height: 1.2;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--mp-on-surface-variant);
    flex: 0 0 auto;
  }
`;
