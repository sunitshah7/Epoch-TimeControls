import { useState } from 'react';
import { ActionIcon, Badge, Group, Select, Text, Tooltip, type SelectProps } from '@mantine/core';
import { IconCheck, IconCurrentLocation } from '@tabler/icons-react';
import {
  BROWSER_TIMEZONE_VALUE,
  filterTimezoneOptions,
  getAllTimezoneOptions,
  getPinnedTimezoneOptions,
  getTimezoneOption,
  groupTimezoneOptions,
  type TimezoneOption,
} from '../timezones.js';

export interface TimezoneSelectProps {
  /** Currently selected IANA timezone, e.g. "America/New_York". */
  value: string;
  /** Called with the resolved IANA zone (never the internal browser-time sentinel). */
  onChange: (timezone: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Shows a small button that resets the selection to the browser's own timezone. Default: true. */
  showCurrentLocationButton?: boolean;
  style?: React.CSSProperties;
}

function renderTimezoneOption({ option, checked }: Parameters<NonNullable<SelectProps['renderOption']>>[0]) {
  const opt = option as unknown as TimezoneOption;
  const subtitle = [opt.country, opt.abbrev].filter(Boolean).join(', ');
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm" style={{ width: '100%' }}>
      <Group gap={6} wrap="nowrap">
        {checked && <IconCheck size={14} style={{ flexShrink: 0 }} />}
        <div>
          <Text size="sm" fw={500}>{opt.displayName}</Text>
          {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}
        </div>
      </Group>
      <Badge variant="light" color="gray" style={{ flexShrink: 0 }}>{opt.offsetLabel}</Badge>
    </Group>
  );
}

/**
 * A searchable timezone picker: two-line options (name + country/abbreviation),
 * a UTC-offset badge, region grouping, pinned "Browser Time"/"UTC" shortcuts,
 * and word-prefix search that understands common country aliases (e.g. "usa").
 */
export function TimezoneSelect({
  value,
  onChange,
  label = 'Timezone',
  placeholder = 'Type to search (country, city, abbreviation)',
  error,
  required,
  disabled,
  showCurrentLocationButton = true,
  style,
}: TimezoneSelectProps) {
  const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [searchInput, setSearchInput] = useState('');
  const [dropdownOpened, setDropdownOpened] = useState(false);

  // `value` can be a zone that isn't literally present in
  // getAllTimezoneOptions()'s enumeration (some JS engines only list an
  // older alias for the same real zone) — append it so the Select always
  // has a matching entry to display instead of blank.
  const baseOptions = getAllTimezoneOptions();
  const flatOptions = baseOptions.some((option) => option.value === value)
    ? baseOptions
    : [...baseOptions, getTimezoneOption(value)];
  const data = [...getPinnedTimezoneOptions(defaultTz), ...groupTimezoneOptions(flatOptions)];
  const selectedOption = flatOptions.find((option) => option.value === value);

  return (
    <Group align="flex-end" gap="xs" wrap="nowrap" style={style}>
      <Select
        style={{ flex: 1 }}
        label={label}
        placeholder={placeholder}
        data={data as SelectProps['data']}
        value={value}
        // flatOptions is constructed above to always contain an entry for
        // `value` (falling back to a synthesized one), so this find()
        // always succeeds — the `?? ''` is unreachable defensive code.
        // v8 ignore next
        searchValue={dropdownOpened ? searchInput : (selectedOption?.label ?? '')}
        onSearchChange={setSearchInput}
        onDropdownOpen={() => {
          setDropdownOpened(true);
          setSearchInput('');
        }}
        onDropdownClose={() => setDropdownOpened(false)}
        onChange={(next) => {
          // This Select has no clear button, so Mantine never calls
          // onChange with a falsy value in practice — defensive only.
          /* v8 ignore next */
          if (!next) return;
          onChange(next === BROWSER_TIMEZONE_VALUE ? defaultTz : next);
        }}
        error={error}
        disabled={disabled}
        searchable
        // Mantine's Select data (see `data` above) actually carries our
        // richer TimezoneOption shape, not its own generic ComboboxItem —
        // this cast documents that boundary rather than fighting it.
        filter={filterTimezoneOptions as unknown as SelectProps['filter']}
        renderOption={renderTimezoneOption}
        maxDropdownHeight={340}
        nothingFoundMessage="No timezone found"
        withAsterisk={required}
      />
      {showCurrentLocationButton && (
        <Tooltip label="Use current timezone">
          <ActionIcon
            variant="default"
            size="input-sm"
            onClick={() => onChange(defaultTz)}
            disabled={disabled}
            aria-label="Use current timezone"
          >
            <IconCurrentLocation size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
