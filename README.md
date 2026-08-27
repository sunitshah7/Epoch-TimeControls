# epoch-time-controls

[![Tests](https://github.com/sunitshah7/Epoch-TimeControls/actions/workflows/test.yml/badge.svg)](https://github.com/sunitshah7/Epoch-TimeControls/actions/workflows/test.yml)
<!-- COVERAGE-BADGES:START -->
![statements coverage](https://img.shields.io/badge/statements-100%25-brightgreen) ![branches coverage](https://img.shields.io/badge/branches-100%25-brightgreen) ![functions coverage](https://img.shields.io/badge/functions-100%25-brightgreen) ![lines coverage](https://img.shields.io/badge/lines-100%25-brightgreen)
<!-- COVERAGE-BADGES:END -->

A sleek, searchable date/time + timezone picker for [Mantine](https://mantine.dev) apps, extracted from
[Epoch](https://github.com/sunitshah7/countdown)'s countdown-creation form.

- **`TimezoneSelect`** — a searchable timezone `Select` with two-line options (city + country/abbreviation),
  a UTC-offset badge, region grouping, pinned "Browser Time"/"UTC" shortcuts, and word-prefix search that
  understands common aliases (e.g. "usa" finds US zones, not "Lusaka" or "Jerusalem").
- **`EpochDateTimePicker`** — a modal `DateTimePicker` paired with `TimezoneSelect`, with optional quick-pick
  presets ("Today", "In 7 days", "In 60 min", ...).

## Install

```bash
npm install epoch-time-controls @mantine/core @mantine/dates @mantine/hooks
```

`@mantine/core`, `@mantine/dates`, `@mantine/hooks`, `react`, and `react-dom` are peer dependencies — this
package assumes your app already renders inside a `MantineProvider` and has `@mantine/dates`' CSS imported
(`import '@mantine/dates/styles.css'`), same as any other Mantine `@mantine/dates` component.

## Usage

### Timezone select on its own

```tsx
import { useState } from 'react';
import { TimezoneSelect } from 'epoch-time-controls';

function MyForm() {
  const [timezone, setTimezone] = useState('UTC');
  return <TimezoneSelect value={timezone} onChange={setTimezone} required />;
}
```

### Combined date + timezone control

```tsx
import { useState } from 'react';
import { EpochDateTimePicker, createQuickDatePresets, createQuickTimePresets, DEFAULT_TIME_OF_DAY_PRESETS } from 'epoch-time-controls';

function MyForm() {
  const [date, setDate] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('UTC');

  return (
    <EpochDateTimePicker
      label="Target Date & Time"
      value={date}
      onChange={setDate}
      timezone={timezone}
      onTimezoneChange={setTimezone}
      required
      // Optional: replicate Epoch's own quick-pick presets.
      presets={[...createQuickDatePresets(), ...createQuickTimePresets()]}
      timeOfDayPresets={DEFAULT_TIME_OF_DAY_PRESETS}
    />
  );
}
```

Omit `presets`/`timeOfDayPresets` for a plain picker with no quick-pick buttons — they're both fully optional.

## API

### `<TimezoneSelect />`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Currently selected IANA timezone (e.g. `"America/New_York"`). |
| `onChange` | `(timezone: string) => void` | — | Called with the resolved IANA zone (never the internal browser-time sentinel). |
| `label` | `string` | `"Timezone"` | |
| `placeholder` | `string` | `"Type to search…"` | |
| `error` | `string` | — | |
| `required` | `boolean` | — | |
| `disabled` | `boolean` | — | |
| `showCurrentLocationButton` | `boolean` | `true` | Shows a button that resets the selection to the browser's own timezone. |
| `style` | `React.CSSProperties` | — | Applied to the outer `Group`. |

### `<EpochDateTimePicker />`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `Date \| string \| null` | — | Mantine `DateTimePicker` value. |
| `onChange` | `(value: string \| null) => void` | — | |
| `dateError` | `string` | — | |
| `timezone` | `string` | — | |
| `onTimezoneChange` | `(timezone: string) => void` | — | |
| `timezoneLabel` / `timezonePlaceholder` / `timezoneError` | `string` | — | Passed through to the inner `TimezoneSelect`. |
| `required` / `disabled` | `boolean` | — | Applied to both fields. |
| `minDate` | `Date \| null` | `new Date()` | Earliest selectable date. Pass `null` to allow any date. |
| `valueFormat` | `string` | `"ddd, DD MMM YYYY · hh:mm A"` | |
| `presets` | `{ value: string; label: string }[]` | — | Full date+time quick picks. See `createQuickDatePresets`/`createQuickTimePresets`. |
| `timeOfDayPresets` | `string[]` | — | Times-of-day for the embedded `TimePicker` dropdown. See `DEFAULT_TIME_OF_DAY_PRESETS`. |
| `showCurrentLocationButton` | `boolean` | `true` | |

### Utilities

`getAllTimezoneOptions`, `getTimezoneOption`, `getPinnedTimezoneOptions`, `groupTimezoneOptions`,
`filterTimezoneOptions`, and `BROWSER_TIMEZONE_VALUE` are also exported for anyone building a fully custom
timezone UI on top of the same data/search logic `TimezoneSelect` uses internally.

## Development

Requires Node.js 22+ (the test suite's jsdom/undici dependency needs Node internals not present in Node 20).
This only affects local development and CI — it has no bearing on what Node/browser versions can *consume*
the published package.

```bash
npm install
npm test              # run the test suite
npm run test:coverage # run with coverage (100% enforced)
npm run build          # produce dist/ (ESM + CJS + .d.ts) via tsup
```

## License

[MIT](LICENSE)
