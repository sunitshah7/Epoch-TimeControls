import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { getTimezone, getCountry } from 'countries-and-timezones';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface TimezoneOption {
  value: string;
  label: string;
  displayName: string;
  country: string;
  abbrev: string;
  offset: number;
  offsetLabel: string;
  region: string;
  searchWords: string[];
}

export interface TimezoneOptionGroup {
  group: string;
  items: TimezoneOption[];
}

// Sentinel value for the pinned "Browser Time" shortcut — it can't reuse
// the real zone's value, since that zone also appears in its normal
// region group and Mantine's Select requires unique values across all
// options. Translate it back to the real zone in your onChange handler.
export const BROWSER_TIMEZONE_VALUE = '__browser_default__';

function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${hh}:${mm}`;
}

// A handful of IANA zones are still commonly returned under their old
// "backward-compatibility" name (e.g. Asia/Calcutta) even though the city
// itself is now known by a different name (Kolkata). Without this, typing
// the modern name into the search box finds nothing.
const ZONE_SEARCH_ALIASES: Record<string, string> = {
  'Asia/Calcutta': 'kolkata',
  'Asia/Katmandu': 'kathmandu',
  'Asia/Rangoon': 'yangon myanmar burma',
  'Asia/Saigon': 'ho chi minh city vietnam',
  'Asia/Dacca': 'dhaka bangladesh',
  'Asia/Thimbu': 'thimphu bhutan',
  'Europe/Kiev': 'kyiv ukraine',
  'America/Godthab': 'nuuk greenland',
  'Asia/Chungking': 'chongqing china',
  'Asia/Ulan_Bator': 'ulaanbaatar mongolia',
  'Africa/Asmera': 'asmara eritrea',
  'Pacific/Ponape': 'pohnpei micronesia',
  'Pacific/Truk': 'chuuk micronesia',
};

// Common short forms people actually type that don't appear anywhere in
// the official country name (so plain substring matching would miss
// them entirely) — keyed by the exact name countries-and-timezones
// returns, lowercased.
const COUNTRY_SEARCH_ALIASES: Record<string, string> = {
  'united states of america': 'usa us america',
  'united kingdom': 'uk britain',
  'united arab emirates': 'uae',
  russia: 'russian federation',
  'south korea': 'korea',
  'north korea': 'korea',
  'democratic republic of the congo': 'drc congo',
  czechia: 'czech republic',
};

// Friendly names for each IANA top-level region, so options can be
// grouped the way most OS timezone pickers do instead of showing one
// long flat list of ~400 entries.
const REGION_LABELS: Record<string, string> = {
  Africa: 'Africa',
  America: 'Americas',
  Antarctica: 'Antarctica',
  Arctic: 'Arctic',
  Asia: 'Asia',
  Atlantic: 'Atlantic',
  Australia: 'Australia',
  Europe: 'Europe',
  Indian: 'Indian Ocean',
  Pacific: 'Pacific',
};

function regionFor(zone: string): string {
  return REGION_LABELS[zone.split('/')[0]] || 'Other';
}

function getAbbreviation(zone: string): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return part ? part.value : '';
  } catch {
    return '';
  }
}

function getCountryNameForZone(zone: string): string {
  const info = getTimezone(zone);
  if (!info || !info.countries.length) return '';
  const country = getCountry(info.countries[0]);
  return country ? country.name : '';
}

// Splits into lowercase word tokens on anything that isn't a letter or
// digit, so "Asia/Calcutta" -> ["asia", "calcutta"] and matching can be
// done per-word instead of as one long substring.
function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function buildOption(zone: string): TimezoneOption {
  const offset = dayjs().tz(zone).utcOffset();
  const offsetLabel = offset === 0 ? 'UTC' : formatOffset(offset);
  const abbrev = getAbbreviation(zone);
  const country = getCountryNameForZone(zone);
  const displayName = zone.replace(/_/g, ' ');
  const label = `${formatOffset(offset)} · ${displayName}`;
  const zoneAlias = ZONE_SEARCH_ALIASES[zone] || '';
  const countryAlias = country ? COUNTRY_SEARCH_ALIASES[country.toLowerCase()] || '' : '';
  const searchWords = tokenize([displayName, country, abbrev, zoneAlias, countryAlias].filter(Boolean).join(' '));

  return {
    value: zone,
    label,
    displayName,
    country,
    abbrev,
    offset,
    offsetLabel,
    region: regionFor(zone),
    searchWords,
  };
}

export interface FilterTimezoneOptionsArgs {
  options: Array<TimezoneOption | TimezoneOptionGroup>;
  search: string;
  limit: number;
}

// A search term matches an option when every word the user typed is a
// *prefix* of some word in that option's searchable text — e.g. "usa"
// matches the word "usa" (a United States alias) but not "Lusaka" or
// "Jerusalem", which plain substring matching would incorrectly do since
// both happen to contain the letters "usa" mid-word. Also handles
// multi-word queries like "new york" (every query word must match).
export function filterTimezoneOptions({
  options,
  search,
  limit,
}: FilterTimezoneOptionsArgs): Array<TimezoneOption | TimezoneOptionGroup> {
  const queryWords = tokenize(search);
  const optionMatches = (option: TimezoneOption) =>
    queryWords.length === 0 || queryWords.every((qw) => option.searchWords.some((w) => w.startsWith(qw)));

  const result: Array<TimezoneOption | TimezoneOptionGroup> = [];
  for (const entry of options) {
    if (result.length === limit) break;
    if ('group' in entry) {
      const items = entry.items.filter(optionMatches);
      if (items.length) result.push({ group: entry.group, items });
    } else if (optionMatches(entry)) {
      result.push(entry);
    }
  }
  return result;
}

let cachedOptions: TimezoneOption[] | null = null;

// Every IANA timezone, sorted by UTC offset. Computed once per session —
// offsets rarely change mid-session, and recomputing on every render
// would be wasteful for ~400 zones.
export function getAllTimezoneOptions(): TimezoneOption[] {
  if (!cachedOptions) {
    cachedOptions = Intl.supportedValuesOf('timeZone')
      .map(buildOption)
      .sort((a, b) => a.offset - b.offset || a.value.localeCompare(b.value));
  }
  return cachedOptions;
}

// A single option built the same way as getAllTimezoneOptions' entries.
// Useful as a fallback when a zone isn't literally present in
// getAllTimezoneOptions()'s enumeration (some JS engines only list an
// older alias for the same real zone).
export function getTimezoneOption(zone: string): TimezoneOption {
  return buildOption(zone);
}

// The pinned "quick pick" rows shown above the region groups: the
// browser-detected timezone and plain UTC.
export function getPinnedTimezoneOptions(defaultTz: string): TimezoneOption[] {
  return [
    { ...buildOption(defaultTz), value: BROWSER_TIMEZONE_VALUE, displayName: 'Browser Time' },
    { ...buildOption('UTC'), displayName: 'Coordinated Universal Time' },
  ];
}

// Groups a flat list of options (as returned by getAllTimezoneOptions,
// optionally with an extra option appended) by region, in the shape
// Mantine's Select expects for grouped data: [{ group, items }]. Excludes
// a literal "UTC" entry, if present, since getPinnedTimezoneOptions
// already covers it and Mantine requires unique values across all
// options. "Other" (Etc/*, etc.) sorts last; everything else
// alphabetically.
export function groupTimezoneOptions(options: TimezoneOption[]): TimezoneOptionGroup[] {
  const groups = new Map<string, TimezoneOption[]>();
  for (const option of options) {
    if (option.value === 'UTC') continue;
    if (!groups.has(option.region)) groups.set(option.region, []);
    groups.get(option.region)!.push(option);
  }
  const regionNames = [...groups.keys()].sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });
  return regionNames.map((region) => ({ group: region, items: groups.get(region)! }));
}
