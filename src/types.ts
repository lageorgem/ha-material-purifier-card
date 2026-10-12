import type { ActionConfig, LovelaceCardConfig } from 'custom-card-helpers';

/** How a selector feature is laid out. */
export type FeatureDisplay = 'icons' | 'dropdown' | 'tile';

/** How an entity-tile is laid out: a bare icon chip, or a full tile with title + value. */
export type EntityTileDisplay = 'icon' | 'tile';

/** Air-quality metrics the card can read and display. */
export type AqiMetric = 'us_aqi' | 'cn_aqi' | 'pm25';

/** EPA PM2.5 breakpoint revision used for US AQI. 2024 is current (EPA, May 2024). */
export type UsAqiBreakpoints = '2024' | '2012';

/** Household dust level used to pick the vacuum-reminder threshold. */
export type DustLevel = 'low' | 'medium' | 'high';

export type FeatureType =
  | 'fan-presets'
  | 'speed-wheel'
  | 'filter-vacuum'
  | 'input-select'
  | 'switch-group'
  | 'switch-list'
  | 'button-list'
  | 'entity-tile'
  | 'sensor-list'
  | 'percentage-tile';

/**
 * Per-option override for selectors (fan presets, input_select).
 * `value` keys the override to an underlying option; `label`/`icon` override
 * the displayed text/icon; `hide` removes the option from the row.
 */
export interface OptionOverride {
  value: string;
  label?: string;
  icon?: string;
  hide?: boolean;
  /** Accent color override (hex). Unset = the theme/default color for the option. */
  color?: string;
}

/** A single entity entry for switch/button/sensor list-style features. */
export interface EntityItem {
  entity: string;
  label?: string;
  icon?: string;
  /** Accent color override (hex), applied to the tile in tile display. */
  color?: string;
}

interface BaseSelectorFeature {
  display?: FeatureDisplay;
  /** Optional title rendered above the selector (e.g. "Mode"). */
  label?: string;
  /** Width as a percentage of the card (10–100, steps of 10). Unset = full width. */
  width?: number;
}

/** Per-option overrides plus an optional explicit display order of values. */
interface OrderedOptions {
  options?: OptionOverride[];
  /** Explicit order of option values; unlisted values follow in their natural order. */
  order?: string[];
}

/** The purifier fan's preset modes (Auto / Silent / Favorite …) as a selector. */
export interface FanPresetsFeatureConfig extends BaseSelectorFeature, OrderedOptions {
  type: 'fan-presets';
  /** Prepend an "Off" option that turns the fan off. Default false. */
  show_off?: boolean;
}

/**
 * Mouse-wheel style knob that sets the fan speed. Drag/flick with inertia,
 * scroll while hovered, or use arrow keys. Commits after a short debounce.
 */
export interface SpeedWheelFeatureConfig {
  type: 'speed-wheel';
  label?: string;
  /** number.* / input_number.* that sets the fan speed. Unset = fan.set_percentage when supported. */
  entity?: string;
  /**
   * Preset activated before a speed change. Default: the fan's preset matching /favorite|manual/i.
   * `false` disables.
   */
  preset?: string | false;
  /** 'percent' (default) or 'level' (raw value). */
  display?: 'percent' | 'level';
  /** In other presets (Auto, Sleep…) estimate the live speed from rpm. Default true. */
  estimate_auto?: boolean;
  /** Show room coverage (needs card `cadr`). Default true. */
  show_coverage?: boolean;
  /** Icon shown next to the label. Default mdi:fan. */
  icon?: string;
  /** Accent color override (hex). */
  color?: string;
  /** Width as a percentage of the card (10–100, steps of 10). Unset = 50%. */
  width?: number;
}

/** Air-volume based "vacuum the pre-filter" reminder tile. */
export interface FilterVacuumFeatureConfig {
  type: 'filter-vacuum';
  label?: string;
  /**
   * Utility Meter (cycle: none) counting motor runtime in rpm·h since the last vacuum; its source
   * is an Integration helper over the motor-speed sensor. Both are created by the editor's
   * "Set up tracking" button. Volume = counter × cadr / max rpm. "Mark vacuumed" resets it to 0.
   */
  counter_entity?: string;
  /** Household dust level (card setting; not changeable from the tile). Wins over `dust_level_entity`. Default 'medium'. */
  dust_level?: DustLevel;
  /** Optional input_select / select (low | medium | high) read when `dust_level` is unset. Read-only in the card. */
  dust_level_entity?: string;
  /** m³ thresholds per dust level. Defaults: low 43200, medium 21600, high 10800. */
  thresholds?: Partial<Record<DustLevel, number>>;
  icon?: string;
  color?: string;
  /** Width as a percentage of the card (10–100, steps of 10). Unset = 50%. */
  width?: number;
}

export interface InputSelectFeatureConfig extends BaseSelectorFeature, OrderedOptions {
  type: 'input-select';
  entity: string;
  label?: string;
}

export interface SwitchGroupFeatureConfig extends BaseSelectorFeature {
  type: 'switch-group';
  label?: string;
  entities: EntityItem[];
}

export interface SwitchListFeatureConfig {
  type: 'switch-list';
  label?: string;
  entities: EntityItem[];
  /** Width as a percentage of the card (10–100, steps of 10). Unset = full width. */
  width?: number;
}

export interface ButtonListFeatureConfig {
  type: 'button-list';
  label?: string;
  items: EntityItem[];
  /** Width as a percentage of the card (10–100, steps of 10). Unset = full width. */
  width?: number;
}

/** A list of sensor rows (icon + customizable title + current value). */
export interface SensorListFeatureConfig {
  type: 'sensor-list';
  label?: string;
  items: EntityItem[];
  /** Width as a percentage of the card (10–100, steps of 10). Unset = full width. */
  width?: number;
}

export interface EntityTileFeatureConfig {
  type: 'entity-tile';
  entity: string;
  name?: string;
  icon?: string;
  /** Accent color override (hex), applied to the tile in `tile` display. */
  color?: string;
  /** Layout: a bare icon chip (`icon`) or the full tile with title + value (`tile`, default). */
  display?: EntityTileDisplay;
  tap_action?: ActionConfig;
  /** Width as a percentage of the card (10–100, steps of 10). Unset = 50%. */
  width?: number;
}

export type FeatureConfig =
  | FanPresetsFeatureConfig
  | SpeedWheelFeatureConfig
  | FilterVacuumFeatureConfig
  | InputSelectFeatureConfig
  | SwitchGroupFeatureConfig
  | SwitchListFeatureConfig
  | ButtonListFeatureConfig
  | EntityTileFeatureConfig
  | SensorListFeatureConfig
  | PercentageTileFeatureConfig;

/** A value range mapped to a fill color. `from` inclusive, `to` exclusive (open ends allowed). */
export interface PercentRange {
  from?: number;
  to?: number;
  color: string;
}

/**
 * A tile whose background fills left→right in proportion to a value (e.g. filter life).
 * The fill is solid up to the exact value, with a soft fade added beyond it (so 100% is full).
 */
export interface PercentageTileFeatureConfig {
  type: 'percentage-tile';
  entity: string;
  /** Read this attribute instead of the state. */
  attribute?: string;
  name?: string;
  icon?: string;
  /** Fill color when no range matches. Default: theme primary. */
  color?: string;
  /** Value mapped to an empty tile. Default 0. */
  min?: number;
  /** Value mapped to a full tile. Default 100. */
  max?: number;
  /** First matching range wins; evaluated against the raw value. */
  ranges?: PercentRange[];
  tap_action?: ActionConfig;
  /** Width as a percentage of the card (10–100, steps of 10). Unset = 50%. */
  width?: number;
}

/** Which AQI scale is used when the shown metric is AQI. */
export type AqiScale = 'us' | 'cn';

export interface AqiConfig {
  /** Sensor (or entity + attribute) holding the air-quality reading. Default: auto-detect a PM2.5 sensor on the fan's device. */
  entity?: string;
  attribute?: string;
  /** What the entity reports. Default: inferred — µg/m³ unit or device_class pm25 → 'pm25', otherwise 'pm25'. */
  source?: AqiMetric;
  /**
   * What the dial shows: 'aqi' (index on `scale`) or 'pm25' (µg/m³). Default 'aqi'.
   * Legacy values 'us_aqi' / 'cn_aqi' are accepted and imply 'aqi' with that scale.
   */
  metric?: 'aqi' | 'pm25' | 'us_aqi' | 'cn_aqi';
  /** AQI scale: 'us' (EPA) or 'cn' (HJ 633-2012). Default 'us'. Wins over a legacy metric's scale. */
  scale?: AqiScale;
  /** Tapping the unit label toggles AQI ↔ µg/m³ (remembered per browser). Default false. */
  allow_cycle?: boolean;
  /** US AQI breakpoint revision. Default '2024'. */
  us_breakpoints?: UsAqiBreakpoints;
}

export interface SpeedConfig {
  /** number.* or input_number.* that sets the fan speed (e.g. Favorite level). Unset = fan.set_percentage when the fan supports it. */
  entity?: string;
  /**
   * Preset activated before a speed change when the fan is in another preset.
   * Default: the fan's preset matching /favorite|manual/i, if any. `false` disables.
   */
  preset?: string | false;
  display?: 'percent' | 'level';
  estimate_auto?: boolean;
}

/** One measured point from the Calibrate button: speed value (entity value or %) → rpm. */
export interface CalibrationPoint {
  value: number;
  rpm: number;
}

export interface MaterialPurifierCardConfig extends LovelaceCardConfig {
  type: string;
  /** The purifier's fan.* entity. */
  entity: string;
  name?: string;
  /** Show the card title (name). Default true; false hides the header row entirely. */
  show_name?: boolean;
  theme?: string;
  aqi?: AqiConfig;
  /** @deprecated Legacy card-level speed settings; the speed-wheel feature's own fields win. */
  speed?: SpeedConfig;
  /** Motor-speed sensor (rpm). Default: auto-detect an rpm sensor on the fan's device. */
  motor_speed_entity?: string;
  /** Override for full-speed rpm. Default: the highest rpm in `calibration`. No built-in default. */
  max_rpm?: number;
  /** Clean-air delivery rate at full speed, m³/h (from the datasheet). Needed for volume and coverage. */
  cadr?: number;
  /** Written by the editor's Calibrate button. */
  calibration?: CalibrationPoint[];
  features?: FeatureConfig[];
}

/** Item handed to the shared selector-row component. */
export interface SelectorItem {
  value: string;
  label: string;
  icon?: string;
  active?: boolean;
  disabled?: boolean;
  /** Accent color (CSS) for this option — feeds the tile tint in tile display. */
  color?: string;
}
