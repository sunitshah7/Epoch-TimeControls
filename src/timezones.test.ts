import { describe, it, expect, vi } from 'vitest';
import { getCountry } from 'countries-and-timezones';
import {
  BROWSER_TIMEZONE_VALUE,
  filterTimezoneOptions,
  getAllTimezoneOptions,
  getTimezoneOption,
  getPinnedTimezoneOptions,
  groupTimezoneOptions,
  type TimezoneOptionGroup,
} from './timezones.js';

vi.mock('countries-and-timezones', async (importOriginal) => {
  const actual = await importOriginal<typeof import('countries-and-timezones')>();
  return { ...actual, getCountry: vi.fn(actual.getCountry) };
});

describe('getAllTimezoneOptions', () => {
  it('returns every IANA zone, sorted by UTC offset then value', () => {
    const options = getAllTimezoneOptions();
    expect(options.length).toBeGreaterThan(100);
    for (let i = 1; i < options.length; i++) {
      const prev = options[i - 1];
      const curr = options[i];
      const inOrder = prev.offset < curr.offset
        || (prev.offset === curr.offset && prev.value.localeCompare(curr.value) <= 0);
      expect(inOrder).toBe(true);
    }
  });

  it('caches the computed list across calls', () => {
    expect(getAllTimezoneOptions()).toBe(getAllTimezoneOptions());
  });

  it('includes a well-known zone with the expected shape', () => {
    const options = getAllTimezoneOptions();
    const newYork = options.find((o) => o.value === 'America/New_York');
    expect(newYork).toBeDefined();
    expect(newYork!.offsetLabel).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
    expect(newYork!.region).toBe('Americas');
  });

  it('applies known region labels and falls back to "Other" for unmapped prefixes', () => {
    const newYork = getAllTimezoneOptions().find((o) => o.value === 'America/New_York')!;
    expect(newYork.region).toBe('Americas');
    const utc = getTimezoneOption('UTC');
    expect(utc.region).toBe('Other');
    expect(utc.offset).toBe(0);
    expect(utc.offsetLabel).toBe('UTC');
  });

  it('replaces underscores with spaces in the display name', () => {
    const la = getAllTimezoneOptions().find((o) => o.value === 'America/Los_Angeles')!;
    expect(la.displayName).toBe('America/Los Angeles');
  });

  it('resolves a country name for zones tied to a country', () => {
    const tokyo = getAllTimezoneOptions().find((o) => o.value === 'Asia/Tokyo')!;
    expect(tokyo.country).toBe('Japan');
  });

  it('formats negative offsets with a leading minus and zero-padded minutes', () => {
    const halfHourNegative = getAllTimezoneOptions().find((o) => o.offset < 0 && o.offset % 60 !== 0)!;
    expect(halfHourNegative.offsetLabel).toMatch(/^UTC-\d{2}:\d{2}$/);
  });

  it('formats positive non-zero offsets with a leading plus', () => {
    const tokyo = getAllTimezoneOptions().find((o) => o.value === 'Asia/Tokyo')!;
    expect(tokyo.offsetLabel).toBe('UTC+09:00');
  });

  it('includes documented search-alias words for aliased zones and countries', () => {
    const options = getAllTimezoneOptions();
    const calcutta = options.find((o) => o.value === 'Asia/Calcutta');
    if (calcutta) expect(calcutta.searchWords).toContain('kolkata');
    const usZone = options.find((o) => o.country === 'United States of America');
    if (usZone) expect(usZone.searchWords).toContain('usa');
  });
});

describe('getTimezoneOption', () => {
  it('builds a single option the same way getAllTimezoneOptions does for that zone', () => {
    const option = getTimezoneOption('Europe/London');
    expect(option.value).toBe('Europe/London');
    expect(option.displayName).toBe('Europe/London');
    expect(option.region).toBe('Europe');
  });

  it('returns an empty country string for a zone not tied to any country', () => {
    expect(getTimezoneOption('UTC').country).toBe('');
  });

  it('returns an empty abbreviation when Intl.DateTimeFormat throws', () => {
    const original = Intl.DateTimeFormat;
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('unsupported time zone');
    });
    expect(getTimezoneOption('Europe/London').abbrev).toBe('');
    Intl.DateTimeFormat = original;
  });

  it('returns an empty abbreviation when formatToParts has no timeZoneName part', () => {
    const original = Intl.DateTimeFormat;
    // A plain `function`, not an arrow function, so `new Intl.DateTimeFormat(...)`
    // inside getAbbreviation actually receives this mock's returned object
    // instead of throwing (arrow functions can't be used as constructors).
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function () {
      return { formatToParts: () => [{ type: 'literal', value: '' }] } as unknown as Intl.DateTimeFormat;
    });
    expect(getTimezoneOption('Europe/London').abbrev).toBe('');
    Intl.DateTimeFormat = original;
  });

  it('returns an empty country name when the zone maps to a country code with no known name', () => {
    vi.mocked(getCountry).mockReturnValueOnce(undefined);
    expect(getTimezoneOption('Europe/London').country).toBe('');
  });
});

describe('getPinnedTimezoneOptions', () => {
  it('returns a Browser Time entry (sentinel value) and a UTC entry', () => {
    const [browserOption, utcOption] = getPinnedTimezoneOptions('Asia/Tokyo');
    expect(browserOption.value).toBe(BROWSER_TIMEZONE_VALUE);
    expect(browserOption.displayName).toBe('Browser Time');
    expect(browserOption.offset).toBe(getTimezoneOption('Asia/Tokyo').offset);
    expect(utcOption.value).toBe('UTC');
    expect(utcOption.displayName).toBe('Coordinated Universal Time');
  });
});

describe('groupTimezoneOptions', () => {
  it('groups options by region, sorted alphabetically with "Other" last', () => {
    const flat = [
      getTimezoneOption('Asia/Tokyo'),
      getTimezoneOption('America/New_York'),
      getTimezoneOption('Etc/GMT'),
      getTimezoneOption('Europe/Paris'),
    ];
    const grouped = groupTimezoneOptions(flat);
    const groupNames = grouped.map((g) => g.group);
    expect(groupNames[groupNames.length - 1]).toBe('Other');
    const sortedExceptOther = groupNames.slice(0, -1);
    expect([...sortedExceptOther].sort((a, b) => a.localeCompare(b))).toEqual(sortedExceptOther);
  });

  it('excludes a literal "UTC" entry (already covered by the pinned options)', () => {
    const grouped = groupTimezoneOptions([getTimezoneOption('UTC'), getTimezoneOption('Asia/Tokyo')]);
    const allValues = grouped.flatMap((g) => g.items.map((i) => i.value));
    expect(allValues).not.toContain('UTC');
    expect(allValues).toContain('Asia/Tokyo');
  });
});

describe('filterTimezoneOptions', () => {
  const flatOptions = [
    getTimezoneOption('America/New_York'),
    getTimezoneOption('America/Los_Angeles'),
    getTimezoneOption('Asia/Jerusalem'),
    getTimezoneOption('Africa/Lusaka'),
  ];
  const groupedOptions: TimezoneOptionGroup[] = groupTimezoneOptions(flatOptions);

  it('returns everything unfiltered when the search is empty', () => {
    expect(filterTimezoneOptions({ options: flatOptions, search: '', limit: 100 })).toHaveLength(flatOptions.length);
  });

  it('matches "usa" to US zones without matching Lusaka or Jerusalem (prefix, not substring)', () => {
    const result = filterTimezoneOptions({ options: flatOptions, search: 'usa', limit: 100 });
    const values = result.map((r) => (('value' in r) ? r.value : ''));
    expect(values).toContain('America/New_York');
    expect(values).toContain('America/Los_Angeles');
    expect(values).not.toContain('Asia/Jerusalem');
    expect(values).not.toContain('Africa/Lusaka');
  });

  it('requires every word of a multi-word query to match', () => {
    const result = filterTimezoneOptions({ options: flatOptions, search: 'new york', limit: 100 });
    expect(result.map((r) => ('value' in r ? r.value : ''))).toEqual(['America/New_York']);
  });

  it('filters within groups and drops empty groups entirely', () => {
    expect(filterTimezoneOptions({ options: groupedOptions, search: 'tokyo', limit: 100 })).toEqual([]);
  });

  it('keeps a group when at least one of its items matches', () => {
    const result = filterTimezoneOptions({ options: groupedOptions, search: 'usa', limit: 100 });
    expect(result.length).toBeGreaterThan(0);
    for (const group of result) {
      expect('items' in group && group.items.length).toBeGreaterThan(0);
    }
  });

  it('stops accumulating once the limit is reached', () => {
    expect(filterTimezoneOptions({ options: flatOptions, search: '', limit: 2 })).toHaveLength(2);
  });

  it('returns no matches for a query that matches nothing', () => {
    expect(filterTimezoneOptions({ options: flatOptions, search: 'zzzznotreal', limit: 100 })).toEqual([]);
  });
});
