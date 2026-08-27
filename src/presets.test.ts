import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { createQuickDatePresets, createQuickTimePresets, DEFAULT_TIME_OF_DAY_PRESETS } from './presets.js';

describe('createQuickDatePresets', () => {
  it('produces Today/Tomorrow/In 7 days/In 1 month/In 6 months, formatted for the DateTimePicker', () => {
    const now = dayjs('2026-03-15T10:30:00');
    const presets = createQuickDatePresets(now);
    expect(presets.map((p) => p.label)).toEqual(['Today', 'Tomorrow', 'In 7 days', 'In 1 month', 'In 6 months']);
    expect(presets[0].value).toBe(now.endOf('day').format('YYYY-MM-DD HH:mm:ss'));
    expect(presets[1].value).toBe(now.add(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('defaults to the current time when no `now` is given', () => {
    const presets = createQuickDatePresets();
    expect(presets).toHaveLength(5);
  });
});

describe('createQuickTimePresets', () => {
  it('produces In 60 min/3 hours/24 hours/48 hours/72 hours, formatted for the DateTimePicker', () => {
    const now = dayjs('2026-03-15T10:30:00');
    const presets = createQuickTimePresets(now);
    expect(presets.map((p) => p.label)).toEqual(['In 60 min', 'In 3 hours', 'In 24 hours', 'In 48 hours', 'In 72 hours']);
    expect(presets[0].value).toBe(now.add(60, 'minute').format('YYYY-MM-DD HH:mm:ss'));
  });
});

describe('DEFAULT_TIME_OF_DAY_PRESETS', () => {
  it('lists five times of day', () => {
    expect(DEFAULT_TIME_OF_DAY_PRESETS).toEqual(['09:00', '12:00', '15:00', '18:00', '21:00']);
  });
});
