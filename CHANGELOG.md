# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.1] - 2026-10-12

### Changed

- Speed wheel: 4px of space above and below the drum, and its top/bottom fade now blends into the tile's own background in every theme and state.
- Wide cards: half-width tiles keep their natural height instead of stretching to a taller neighbour; tile widths are interpreted consistently by the layout and the tiles; the card provides sensible default sizing in Sections views.
- README: rewritten for users (device-agnostic), dark-first screenshots, a screenshot for every feature, and a layout section.

## [1.0.0] - 2026-10-12

First public release.

### Added

- Material 3 Expressive purifier card with a translucent AQI-colored halo gradient (no solid disc) and matching particles that spawn at the outer edge and fade gradually toward the center: pollution-driven spawning, fan-speed/RPM-driven suction, calm drift when off, off-screen pause, and a static field under reduced motion. The air-quality value stays centered.
- AQI or concentration display selected by `aqi.metric: aqi | pm25` (default `aqi`), labeled only AQI or µg/m³. `aqi.scale: us | cn` (default `us`) selects US AQI (EPA 2024 or legacy 2012) or CN PM2.5 IAQI; legacy `us_aqi`/`cn_aqi` metrics remain accepted. Browser-persisted AQI ↔ µg/m³ cycling is opt-in (`aqi.allow_cycle` defaults to `false`).
- Bottom-left power and bottom-right mode controls (mode cycles the fan's preset modes), fan preset selectors, and a debounced drag/flick/scroll/keyboard speed wheel with automatic Favorite/Manual preset selection.
- Percentage (default) or raw-level speed display; Favorite levels 0–14 map to 7%–100%. Optional CADR-based room coverage uses calibrated airflow × 0.07–0.12 m² (GB/T 18801 rule of thumb).
- **Calibrate** measures only the highest speed step first, then the lowest, typically in about a minute. It assumes linear steps between endpoints for any step count, including 15 levels, 100 × 1% steps and fan percentage. YAML `calibration` is a list of `{value, rpm}`: two points by default, with additional points allowed and piecewise-linear interpolation. The previous mode, level and on/off state are always restored, including when stopped. Auto/Sleep speed estimation uses calibration first, history learning as fallback.
- Calibration accepts RPM only when it repeats unchanged on consecutive polls with distinct `last_reported` timestamps. When the frontend cannot see unchanged polls, RPM must remain unchanged for at least max(6 seconds, twice the typical reading gap); after 90 seconds without settling, it uses the median of recent readings. This avoids spin-up overshoot, such as a Xiaomi 4 Lite briefly reaching about 2,100 RPM before settling at about 1,940 RPM.
- The **Vacuum filter** feature editor opens with an explainer: dust and hair collect on the cylindrical filter's outer mesh, which should be vacuumed regularly; the tile counts air since the last vacuum. The YAML type remains `filter-vacuum`.
- Resettable filter vacuum reminder with one tracking option, `counter_entity`: **Set up tracking** creates an Integration helper over motor RPM (hours, left Riemann sum, two decimal places, five-minute maximum sub-interval) and a Utility Meter with no scheduled cycle, requiring an administrator account. Integration adds up the rate but cannot be reset; the meter counts rpm·h since the last vacuum. **Mark vacuumed** calls `utility_meter.reset` → 0; volume is counter × CADR / maximum RPM. ETA uses the average rate since the last vacuum, with hourly statistics only as fallback; the tile shows title + ETA only and guides missing setup. Feature `dust_level` still wins over the optional read-only `dust_level_entity` fallback.
- `percentage-tile` with entity state/attribute input, configurable bounds and first-match color ranges, tap actions, and 50% default width. Fill is solid to the exact value with a soft fade beyond it, so 100% is completely full. The full example shows filter life in red below 20, amber from 20 to below 50, and green from 50 upward.
- Entity tiles, sensor lists, switch lists/groups, button lists, and input-select features with percentage-width layout.
- Material You theme tokens with Home Assistant color fallbacks.
- `show_name` option (default `true`) and visual editor **Show name** toggle; `false` hides the title row and moves the dial up while `name` still sets the card's accessible label.
- Visual configuration for all ten feature types, rounded pickers, AQI preview, dropdown row, motor/CADR calibration section, and drag-to-reorder features, options and list items.
- HACS/manual installation documentation, YAML option reference, full card example, and Home Assistant vacuum-reminder package.

### Changed

- Default vacuum thresholds are now low **250,000 m³**, medium **125,000 m³**, and high **62,500 m³**. Medium is calibrated to approximately two months for a 360 m³/h purifier running mostly in Auto at around 500 RPM; thresholds remain configurable.
- Vacuum ETA now divides the counter by hours since `last_reset` after at least 15 minutes, including off periods, and recomputes on Home Assistant updates. When the reset is unknown or too recent, it uses 14 days of hourly statistics: non-negative changes divided by covered hours, fetched at most once per hour. This avoids treating a partial day's usage as a full day's rate; unavailable or zero rates show **No estimate yet**. Estimates beyond four weeks use rounded months.
- Speed settings now belong to the `speed-wheel` feature (`entity`, `preset`, `display`, `estimate_auto`, `show_coverage`). Legacy card-level `speed` is deprecated but still read as a fallback; the editor migrates it into the wheel.
- Device-provided data only: no model detection, built-in coverage tables, default CADR or default maximum RPM. Supply datasheet `cadr`; `max_rpm` is optional and otherwise resolves to the highest calibrated RPM.
- Vacuum examples now integrate motor RPM directly into a resettable Utility Meter; the manual package includes an optional notification binary sensor with user-supplied CADR and maximum RPM, plus an optional input-button reset automation.

[1.0.0]: https://github.com/lageorgem/ha-material-purifier-card/releases/tag/v1.0.0
