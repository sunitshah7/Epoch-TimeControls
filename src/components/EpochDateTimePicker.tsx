import { Stack } from '@mantine/core';
import { DateTimePicker, type DateTimePickerProps } from '@mantine/dates';
import { TimezoneSelect } from './TimezoneSelect.js';
import type { DateTimePreset } from '../presets.js';

export interface EpochDateTimePickerProps {
  /** Label for the date/time field. */
  label?: string;
  placeholder?: string;
  /** Mantine DateTimePicker value — a Date, an ISO-ish string, or null. */
  value: DateTimePickerProps['value'];
  onChange: (value: string | null) => void;
  dateError?: string;
  /** Currently selected IANA timezone, e.g. "America/New_York". */
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
  timezoneLabel?: string;
  timezonePlaceholder?: string;
  timezoneError?: string;
  required?: boolean;
  disabled?: boolean;
  /** Earliest selectable date. Defaults to now (no past dates). Pass `null` to allow any date. */
  minDate?: Date | null;
  valueFormat?: string;
  /** Full date+time quick picks (e.g. from createQuickDatePresets()/createQuickTimePresets()). Omit for none. */
  presets?: DateTimePreset[];
  /** Times-of-day shown in the embedded TimePicker dropdown (e.g. DEFAULT_TIME_OF_DAY_PRESETS). Omit for none. */
  timeOfDayPresets?: string[];
  /** Shows a button that resets the timezone to the browser's own. Default: true. */
  showCurrentLocationButton?: boolean;
}

/**
 * Epoch's combined "target date & time" control: a modal DateTimePicker
 * (with optional quick-pick presets) paired with a searchable, sleek
 * TimezoneSelect underneath. Mirrors https://github.com/sunitshah7/countdown's
 * Home page picker.
 */
export function EpochDateTimePicker({
  label = 'Date & Time',
  placeholder = 'Pick date and time',
  value,
  onChange,
  dateError,
  timezone,
  onTimezoneChange,
  timezoneLabel,
  timezonePlaceholder,
  timezoneError,
  required,
  disabled,
  minDate,
  valueFormat = 'ddd, DD MMM YYYY · hh:mm A',
  presets,
  timeOfDayPresets,
  showCurrentLocationButton,
}: EpochDateTimePickerProps) {
  return (
    <Stack gap="sm">
      <DateTimePicker
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(next) => onChange(next as string | null)}
        error={dateError}
        disabled={disabled}
        minDate={minDate === null ? undefined : minDate ?? new Date()}
        valueFormat={valueFormat}
        clearable
        withAsterisk={required}
        dropdownType="modal"
        modalProps={{ centered: true }}
        presets={presets}
        timePickerProps={
          timeOfDayPresets
            ? { format: '12h', withDropdown: true, presets: timeOfDayPresets }
            : { format: '12h', withDropdown: true }
        }
      />
      <TimezoneSelect
        value={timezone}
        onChange={onTimezoneChange}
        label={timezoneLabel}
        placeholder={timezonePlaceholder}
        error={timezoneError}
        required={required}
        disabled={disabled}
        showCurrentLocationButton={showCurrentLocationButton}
      />
    </Stack>
  );
}
