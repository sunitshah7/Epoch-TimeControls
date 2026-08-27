import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../test/testUtils.js';
import { TimezoneSelect } from './TimezoneSelect.js';

// Mantine's Select renders options inside a virtualized ScrollArea; once
// the dropdown is open, resolving an option via getByRole/findByRole
// reliably makes the dropdown close itself before the click lands (a
// quirk of this component/jsdom combination). A plain attribute selector
// sidesteps that and is reliable.
function selectOption(value: string) {
  const option = document.querySelector(`[role="option"][value="${value}"]`);
  fireEvent.click(option!);
}

describe('TimezoneSelect', () => {
  it('shows the current value', () => {
    renderWithProvider(<TimezoneSelect value="Asia/Tokyo" onChange={() => {}} />);
    expect(screen.getByRole('combobox', { name: 'Timezone' }).getAttribute('value')).toContain('Asia/Tokyo');
  });

  it('supports a custom label, placeholder, and required/error state', () => {
    renderWithProvider(
      <TimezoneSelect
        value="UTC"
        onChange={() => {}}
        label="Meeting timezone"
        placeholder="Search..."
        required
        error="Please choose one"
      />,
    );
    expect(screen.getByText('Meeting timezone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Please choose one')).toBeInTheDocument();
  });

  it('lets the user search for and pick a different timezone', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProvider(<TimezoneSelect value="UTC" onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Timezone' });
    await user.click(input);
    await user.type(input, 'Tokyo');
    await screen.findByText('Asia/Tokyo');
    selectOption('Asia/Tokyo');
    expect(onChange).toHaveBeenCalledWith('Asia/Tokyo');
  });

  it('resolves the pinned "Browser Time" option to the real default zone, not the sentinel', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const expectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    renderWithProvider(<TimezoneSelect value="UTC" onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Timezone' });
    await user.click(input);
    await screen.findByText('Browser Time');
    selectOption('__browser_default__');
    expect(onChange).toHaveBeenCalledWith(expectedTz);
  });

  it('clears the search text when the dropdown opens', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TimezoneSelect value="Asia/Tokyo" onChange={() => {}} />);
    const input = screen.getByRole('combobox', { name: 'Timezone' });
    await user.click(input);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('resets to the browser timezone when the shortcut button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const expectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    renderWithProvider(<TimezoneSelect value="Asia/Tokyo" onChange={onChange} />);
    await user.click(screen.getByLabelText('Use current timezone'));
    expect(onChange).toHaveBeenCalledWith(expectedTz);
  });

  it('hides the shortcut button when showCurrentLocationButton is false', () => {
    renderWithProvider(<TimezoneSelect value="UTC" onChange={() => {}} showCurrentLocationButton={false} />);
    expect(screen.queryByLabelText('Use current timezone')).not.toBeInTheDocument();
  });

  it('disables both the select and the shortcut button when disabled', () => {
    renderWithProvider(<TimezoneSelect value="UTC" onChange={() => {}} disabled />);
    expect(screen.getByRole('combobox', { name: 'Timezone' })).toBeDisabled();
    expect(screen.getByLabelText('Use current timezone')).toBeDisabled();
  });

  it('still resolves to a matching option when the current value is not in the base enumeration', () => {
    // Asia/Calcutta is a legacy alias — this exercises the "append a
    // synthesized option" fallback path even when it happens to already
    // be enumerated on the current runtime.
    renderWithProvider(<TimezoneSelect value="Asia/Calcutta" onChange={() => {}} />);
    expect(screen.getByRole('combobox', { name: 'Timezone' }).getAttribute('value')).toContain('Asia/Calcutta');
  });
});
