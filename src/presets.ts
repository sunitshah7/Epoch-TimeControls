import dayjs, { type Dayjs } from 'dayjs';

export interface DateTimePreset {
  value: string;
  label: string;
}

interface PresetDefinition {
  label: string;
  compute: (now: Dayjs) => Dayjs;
}

// "Today" is the odd one out — "now" itself isn't a valid future
// date/time, so it jumps to the end of today instead of adding a fixed
// offset like the others.
const DATE_PRESET_DEFINITIONS: PresetDefinition[] = [
  { label: 'Today', compute: (now) => now.endOf('day') },
  { label: 'Tomorrow', compute: (now) => now.add(1, 'day') },
  { label: 'In 7 days', compute: (now) => now.add(7, 'day') },
  { label: 'In 1 month', compute: (now) => now.add(1, 'month') },
  { label: 'In 6 months', compute: (now) => now.add(6, 'month') },
];

const TIME_PRESET_DEFINITIONS: PresetDefinition[] = [
  { label: 'In 60 min', compute: (now) => now.add(60, 'minute') },
  { label: 'In 3 hours', compute: (now) => now.add(3, 'hour') },
  { label: 'In 24 hours', compute: (now) => now.add(24, 'hour') },
  { label: 'In 48 hours', compute: (now) => now.add(48, 'hour') },
  { label: 'In 72 hours', compute: (now) => now.add(72, 'hour') },
];

function toPresets(definitions: PresetDefinition[], now: Dayjs): DateTimePreset[] {
  return definitions.map(({ label, compute }) => ({
    value: compute(now).format('YYYY-MM-DD HH:mm:ss'),
    label,
  }));
}

// Ready-made "Today"/"Tomorrow"/"In 7 days"/etc. quick picks for the
// `presets` prop of Mantine's DateTimePicker (and of EpochDateTimePicker).
// Optional — pass your own array instead, or omit entirely for no
// presets. `now` defaults to the current time but can be pinned for
// testing or to keep presets stable across a render cycle.
export function createQuickDatePresets(now: Dayjs = dayjs()): DateTimePreset[] {
  return toPresets(DATE_PRESET_DEFINITIONS, now);
}

// Ready-made "In 60 min"/"In 3 hours"/etc. quick picks, in the same
// {value, label} shape as createQuickDatePresets — combine both to
// replicate Epoch's own picker.
export function createQuickTimePresets(now: Dayjs = dayjs()): DateTimePreset[] {
  return toPresets(TIME_PRESET_DEFINITIONS, now);
}

// Literal times-of-day for the DateTimePicker's embedded native
// TimePicker dropdown (a different, complementary mechanism from the
// full date+time presets above).
export const DEFAULT_TIME_OF_DAY_PRESETS = ['09:00', '12:00', '15:00', '18:00', '21:00'];
