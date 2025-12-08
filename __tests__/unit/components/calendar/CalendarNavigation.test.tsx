import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarNavigation } from '@/components/calendar/CalendarNavigation';

describe('CalendarNavigation', () => {
  const baseDate = new Date('2025-12-10T12:00:00Z');

  it('renders Today button', () => {
    const onDateChange = vi.fn();
    render(
      <CalendarNavigation
        selectedDate={baseDate}
        currentView="weekly"
        onDateChange={onDateChange}
      />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders previous and next buttons', () => {
    const onDateChange = vi.fn();
    render(
      <CalendarNavigation
        selectedDate={baseDate}
        currentView="weekly"
        onDateChange={onDateChange}
      />
    );

    const prevButton = screen.getByLabelText('Previous');
    const nextButton = screen.getByLabelText('Next');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('displays formatted date for daily view', () => {
    const onDateChange = vi.fn();
    render(
      <CalendarNavigation
        selectedDate={baseDate}
        currentView="daily"
        onDateChange={onDateChange}
      />
    );

    // Should show full date with weekday
    expect(screen.getByText(/December/)).toBeInTheDocument();
  });

  it('calls onDateChange with today when Today button is clicked', () => {
    const onDateChange = vi.fn();
    render(
      <CalendarNavigation
        selectedDate={baseDate}
        currentView="weekly"
        onDateChange={onDateChange}
      />
    );

    fireEvent.click(screen.getByText('Today'));

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const calledDate = onDateChange.mock.calls[0][0];
    const today = new Date();
    expect(calledDate.getDate()).toBe(today.getDate());
    expect(calledDate.getMonth()).toBe(today.getMonth());
    expect(calledDate.getFullYear()).toBe(today.getFullYear());
  });

  it('navigates to previous day in daily view', () => {
    const onDateChange = vi.fn();
    render(
      <CalendarNavigation
        selectedDate={baseDate}
        currentView="daily"
        onDateChange={onDateChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Previous'));

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const calledDate = onDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(baseDate.getDate() - 1);
  });

  it('navigates to next day in daily view', () => {
    const onDateChange = vi.fn();
    render(
      <CalendarNavigation
        selectedDate={baseDate}
        currentView="daily"
        onDateChange={onDateChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Next'));

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const calledDate = onDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(baseDate.getDate() + 1);
  });

  it('navigates by week in weekly view', () => {
    const onDateChange = vi.fn();
    render(
      <CalendarNavigation
        selectedDate={baseDate}
        currentView="weekly"
        onDateChange={onDateChange}
      />
    );

    // Previous week
    fireEvent.click(screen.getByLabelText('Previous'));
    expect(onDateChange).toHaveBeenCalledTimes(1);
    let calledDate = onDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(baseDate.getDate() - 7);

    // Next week
    onDateChange.mockClear();
    fireEvent.click(screen.getByLabelText('Next'));
    expect(onDateChange).toHaveBeenCalledTimes(1);
    calledDate = onDateChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(baseDate.getDate() + 7);
  });

  it('navigates by month in monthly view', () => {
    const onDateChange = vi.fn();
    // Use a date in the middle of the year to avoid wrapping issues
    const midYearDate = new Date('2025-06-10T12:00:00Z');
    render(
      <CalendarNavigation
        selectedDate={midYearDate}
        currentView="monthly"
        onDateChange={onDateChange}
      />
    );

    // Previous month
    fireEvent.click(screen.getByLabelText('Previous'));
    expect(onDateChange).toHaveBeenCalledTimes(1);
    let calledDate = onDateChange.mock.calls[0][0];
    expect(calledDate.getMonth()).toBe(midYearDate.getMonth() - 1);

    // Next month
    onDateChange.mockClear();
    fireEvent.click(screen.getByLabelText('Next'));
    expect(onDateChange).toHaveBeenCalledTimes(1);
    calledDate = onDateChange.mock.calls[0][0];
    expect(calledDate.getMonth()).toBe(midYearDate.getMonth() + 1);
  });

  it('applies custom className', () => {
    const onDateChange = vi.fn();
    const { container } = render(
      <CalendarNavigation
        selectedDate={baseDate}
        currentView="weekly"
        onDateChange={onDateChange}
        className="custom-class"
      />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });
});
