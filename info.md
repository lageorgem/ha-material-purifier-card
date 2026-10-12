# Material Purifier Card

Material 3 Expressive air purifier controls for Home Assistant, designed to pair with
[Material Thermostat Card](https://github.com/lageorgem/ha-material-thermostat-card) and
[Nerwyn's Material You theme](https://github.com/Nerwyn/material-you-theme).

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-purifier-card/master/assets/hero-light.png" alt="Material Purifier Card with AQI halo, speed wheel and filter tiles" width="380">
</p>

- Xiaomi-app-style AQI halo and particles drawn inward by the fan; AQI or µg/m³ display.
- Drag, flick, scroll or keyboard fan-speed wheel; speed settings live in the feature. Percentage/raw-level display and optional CADR-based room coverage.
- Calibrate measures about five speed/RPM points up to full speed and restores the previous state, including when stopped. Auto/Sleep estimates use calibration, then history learning.
- Pre-filter vacuum reminder from a resettable `counter_entity` (rpm·h since the last vacuum), with ETA from its daily statistics. Set up tracking creates an Integration over motor RPM and a Utility Meter with no cycle (administrator required); Mark vacuumed calls `utility_meter.reset` to return the counter to zero. Volume = counter × CADR / maximum RPM. Tile shows title + ETA only.
- Configurable percentage-fill tiles, selectors, switches, buttons and sensor rows.
- Visual editor, percentage-width layout, light/dark themes and reduced-motion support.

Requires Home Assistant **2024.8.0+**. Install the JavaScript dashboard resource, then add:

```yaml
type: custom:material-purifier-card
entity: fan.living_room_purifier
aqi:
  entity: sensor.living_room_pm25
  source: pm25
features:
  - type: fan-presets
  - type: speed-wheel
```

Replace the entity IDs. Xiaomi PM2.5 sensors report µg/m³, not CN AQI. A speed wheel needs fan percentage support or a configured number helper; Xiaomi 4 Lite speed control requires an integration such as Xiaomi Miot Auto.

The card uses only device-provided data: no device tables, model detection, default CADR or default maximum RPM. Enter datasheet `cadr` for volume and coverage; maximum RPM comes from calibration unless overridden by `max_rpm`. Legacy card-level `speed` is deprecated and migrated into the wheel by the editor.

Tracking needs two helpers because motor RPM is a rate: the Integration adds it up (hours, left Riemann sum, two decimal places, five-minute maximum sub-interval) but cannot be reset; the Utility Meter on top can.

See the [README](https://github.com/lageorgem/ha-material-purifier-card#readme) for installation, all options, calibration/tracking setup, and the manual Home Assistant vacuum-reminder package. MIT licensed.
