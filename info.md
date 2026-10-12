# Material Purifier Card

Material 3 Expressive air purifier controls for Home Assistant, designed to pair with
[Material Thermostat Card](https://github.com/lageorgem/ha-material-thermostat-card) and
[Nerwyn's Material You theme](https://github.com/Nerwyn/material-you-theme).

<p align="center">
  <img src="https://raw.githubusercontent.com/lageorgem/ha-material-purifier-card/master/assets/hero-dark.png" alt="Material Purifier Card with AQI halo, speed wheel and filter tiles" width="380">
</p>

- Air-quality value and category, with an AirNow-colored halo; choose US or Chinese AQI, or PM2.5 in µg/m³.
- Power and mode buttons, with mode, speed and RPM status when available.
- Drag, flick, scroll or use arrow keys to adjust speed; display a percentage or raw level.
- Optional room-coverage estimates from your purifier's datasheet CADR and measured speed. **Calibrate** measures the lowest and highest speeds once.
- Pre-filter vacuum reminder with an estimated cleaning date. **Set up tracking** creates the helpers (administrator required); **Mark vacuumed** resets tracking after cleaning.
- Configurable percentage-fill tiles, selectors, switches, buttons and sensor rows.
- Configure visually, choose feature widths, and use light or dark themes.

Requires Home Assistant **2024.8.0+**. Install through HACS or add the JavaScript dashboard resource manually, then add:

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

Replace the entity IDs with your own. The speed wheel needs fan percentage support or a speed-setting `number.*` / `input_number.*` entity. A motor-speed sensor enables calibration and vacuum tracking.

See the [README](https://github.com/lageorgem/ha-material-purifier-card#readme) for installation, all options, and setup examples. MIT licensed.
