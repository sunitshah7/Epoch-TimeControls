import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../test/testUtils.js';
import { EpochDateTimePicker } from './EpochDateTimePicker.js';
import { createQuickDatePresets, createQuickTimePresets, DEFAULT_TIME_OF_DAY_PRESETS } from '../presets.js';

function selectTimezoneOption(value: string) {
  const option = document.querySelector(`[role="option"][value="${value}"]`);
  fireEvent.click(option!);
}

describe('EpochDateTimePicker', () => {
  it('renders the date field and the timezone select together', () => {
    renderWithProvider(
      <EpochDateTimePicker value={null} onChange={() => {}} timezone="UTC" onTimezoneChange={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Date & Time' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Timezone' })).toBeInTheDocument();
  });

  it('shows date and timezone error messages independently', () => {
    renderWithProvider(
      <EpochDateTimePicker
        value={null}
        onChange={() => {}}
        timezone="UTC"
        onTimezoneChange={() => {}}
        dateError="Pick a date"
        timezoneError="Pick a zone"
      />,
    );
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
    expect(screen.getByText('Pick a zone')).toBeInTheDocument();
  });

  it('calls onTimezoneChange when a new timezone is picked', async () => {
    const user = userEvent.setup();
    const onTimezoneChange = vi.fn();
    renderWithProvider(
      <EpochDateTimePicker value={null} onChange={() => {}} timezone="UTC" onTimezoneChange={onTimezoneChange} />,
    );
    const tzInput = screen.getByRole('combobox', { name: 'Timezone' });
    await user.click(tzInput);
    await user.type(tzInput, 'Tokyo');
    await screen.findByText('Asia/Tokyo');
    selectTimezoneOption('Asia/Tokyo');
    expect(onTimezoneChange).toHaveBeenCalledWith('Asia/Tokyo');
  });

  it('shows quick date and time presets when provided, and applies one on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const presets = [...createQuickDatePresets(), ...createQuickTimePresets()];
    renderWithProvider(
      <EpochDateTimePicker
        value={null}
        onChange={onChange}
        timezone="UTC"
        onTimezoneChange={() => {}}
        presets={presets}
        timeOfDayPresets={DEFAULT_TIME_OF_DAY_PRESETS}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Date & Time' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(await screen.findByRole('button', { name: 'In 7 days' }));
    expect(onChange).toHaveBeenCalled();
    await user.keyboard('{Escape}');
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'), { timeout: 5000 });
    expect(dialog).not.toBeInTheDocument();
  });

  it('shows no presets by default', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <EpochDateTimePicker value={null} onChange={() => {}} timezone="UTC" onTimezoneChange={() => {}} />,
    );
    await user.click(screen.getByRole('button', { name: 'Date & Time' }));
    await screen.findByRole('dialog');
    expect(screen.queryByRole('button', { name: 'In 7 days' })).not.toBeInTheDocument();
  });

  it('disables both the date field and the timezone select when disabled', () => {
    renderWithProvider(
      <EpochDateTimePicker value={null} onChange={() => {}} timezone="UTC" onTimezoneChange={() => {}} disabled />,
    );
    expect(screen.getByRole('button', { name: 'Date & Time' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Timezone' })).toBeDisabled();
  });

  it('allows any date when minDate is explicitly null', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <EpochDateTimePicker
        value={null}
        onChange={() => {}}
        timezone="UTC"
        onTimezoneChange={() => {}}
        minDate={null}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Date & Time' }));
    const dialog = await screen.findByRole('dialog');
    // With no minDate restriction, today's day cell should be selectable.
    const todayCell = dialog.querySelector('button[data-disabled="true"]');
    expect(todayCell).toBeNull();
  });

  it('passes custom labels/placeholders through to the timezone field', () => {
    renderWithProvider(
      <EpochDateTimePicker
        value={null}
        onChange={() => {}}
        timezone="UTC"
        onTimezoneChange={() => {}}
        timezoneLabel="Meeting zone"
        timezonePlaceholder="Search zones"
      />,
    );
    expect(screen.getByText('Meeting zone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search zones')).toBeInTheDocument();
  });
});
