import { css } from 'lit';

/**
 * Material 3 token aliases scoped to the card host. We read Nerwyn's
 * `material-you-theme` `--md-sys-*` tokens first, then fall back to standard
 * Home Assistant theme variables, then to hard defaults — so the card looks
 * correct under material-you-theme and degrades gracefully elsewhere.
 *
 * CSS custom properties inherit across shadow boundaries, so defining these on
 * the card host makes them available to every nested feature component.
 */
export const tokens = css`
  :host {
    --mp-primary: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --mp-on-primary: var(--md-sys-color-on-primary, #ffffff);
    --mp-primary-container: var(--md-sys-color-primary-container, rgba(103, 80, 164, 0.16));
    --mp-on-primary-container: var(
      --md-sys-color-on-primary-container,
      var(--primary-text-color, #21005d)
    );

    --mp-surface: var(--md-sys-color-surface, var(--card-background-color, #fef7ff));
    /* Surface containers. Under material-you-theme the real M3 tokens are used.
       Everywhere else we tint the card background toward the on-surface color so
       tiles/lists read as a distinct, slightly elevated surface instead of
       blending into the card (the tint darkens in light themes and lightens in
       dark themes — the right direction for elevation in both). The steps mirror
       M3's container / high / highest elevation ladder. */
    --mp-surface-bg: var(--ha-card-background, var(--card-background-color, #f3edf7));
    --mp-surface-container: var(
      --md-sys-color-surface-container,
      color-mix(in srgb, var(--mp-on-surface) 8%, var(--mp-surface-bg))
    );
    --mp-surface-container-high: var(
      --md-sys-color-surface-container-high,
      color-mix(in srgb, var(--mp-on-surface) 11%, var(--mp-surface-bg))
    );
    --mp-surface-container-highest: var(
      --md-sys-color-surface-container-highest,
      color-mix(in srgb, var(--mp-on-surface) 14%, var(--mp-surface-bg))
    );

    --mp-on-surface: var(--md-sys-color-on-surface, var(--primary-text-color, #1c1b1f));
    --mp-on-surface-variant: var(
      --md-sys-color-on-surface-variant,
      var(--secondary-text-color, #49454f)
    );

    --mp-secondary-container: var(--md-sys-color-secondary-container, rgba(103, 80, 164, 0.14));
    --mp-on-secondary-container: var(
      --md-sys-color-on-secondary-container,
      var(--primary-text-color, #1d192b)
    );

    --mp-outline: var(--md-sys-color-outline, var(--divider-color, #79747e));
    --mp-outline-variant: var(--md-sys-color-outline-variant, var(--divider-color, #cac4d0));
    --mp-error: var(--md-sys-color-error, var(--error-color, #b3261e));

    /* Filled "selected" segment color (matches the stock card's accent). */
    --mp-selected-bg: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --mp-selected-fg: var(--md-sys-color-on-primary, #ffffff);

    --mp-shape-card: var(--md-sys-shape-corner-extra-large, 28px);
    --mp-shape-chip-square: var(--md-sys-shape-corner-large, 16px);
    --mp-shape-full: var(--md-sys-shape-corner-full, 9999px);

    /* State layer opacities per M3 spec. */
    --mp-state-hover: 0.08;
    --mp-state-pressed: 0.12;

    /* Motion — prefer Material You theme motion tokens, fall back to M3 defaults. */
    --mp-motion-dur: var(--md-sys-motion-duration-medium2, 280ms);
    --mp-motion-ease: var(--md-sys-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
  }
`;

/** Heuristic icon for a purifier preset value. */
export function presetIcon(value: string): string {
  const v = value.toLowerCase();
  if (/auto/.test(v)) return 'mdi:fan-auto';
  if (/silent|sleep|night/.test(v)) return 'mdi:weather-night';
  if (/favou?rite/.test(v)) return 'mdi:heart';
  if (/manual/.test(v)) return 'mdi:fan';
  if (/turbo|max|boost|high/.test(v)) return 'mdi:fan-plus';
  if (/low/.test(v)) return 'mdi:fan-minus';
  if (v === 'off') return 'mdi:power';
  return 'mdi:fan';
}

/** Default CSS accent color for a purifier preset value. */
export function presetColor(value: string): string {
  const v = value.toLowerCase();
  const primary = 'var(--md-sys-color-primary, var(--primary-color, #6750a4))';
  if (/auto/.test(v)) return primary;
  if (/silent|sleep|night/.test(v)) return 'var(--state-fan-silent-color, #5c7cfa)';
  if (/favou?rite/.test(v)) return 'var(--md-sys-color-tertiary, #7d5260)';
  if (v === 'off') return 'var(--state-fan-off-color, #8a8a8a)';
  return primary;
}

/**
 * Order a list of values by an optional explicit order: values listed in `order`
 * come first (in that order, ignoring any no-longer-present), then the remaining
 * values in their original order.
 * @param all the available values (natural order)
 * @param order the desired explicit order, if any
 */
export function orderValues(all: string[], order?: string[]): string[] {
  if (!order?.length) return all;
  const available = new Set(all);
  const ordered = order.filter((v) => available.has(v));
  const seen = new Set(ordered);
  return [...ordered, ...all.filter((v) => !seen.has(v))];
}

/**
 * Whether a tile value/state reads as "off" (falsy), so the tile shows its
 * neutral, squarer treatment rather than the accent-tinted, extra-rounded "on"
 * treatment. Covers the explicit off states (`off`/`none`) plus the generically
 * falsy values (empty, `false`, `null`, `0`, `unavailable`, `unknown`), all
 * case-insensitive. Anything else is considered "on".
 * @param value the raw state/option value
 */
export function isOffValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    v === '' ||
    v === 'off' ||
    v === 'none' ||
    v === 'false' ||
    v === 'null' ||
    v === '0' ||
    v === 'unavailable' ||
    v === 'unknown'
  );
}

/** Turn an entity option value into a human label ("fan_only" -> "Fan Only"). */
export function prettyLabel(value: string): string {
  if (value === 'heat_cool') return 'Heat/Cool';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
