import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle } from '@/components/calendar/ViewToggle';

describe('ViewToggle', () => {
  it('renders all three view options', () => {
    const onViewChange = vi.fn();
    render(<ViewToggle currentView="weekly" onViewChange={onViewChange} />);

    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('highlights the current view', () => {
    const onViewChange = vi.fn();
    render(<ViewToggle currentView="weekly" onViewChange={onViewChange} />);

    const weekButton = screen.getByText('Week');
    expect(weekButton).toHaveClass('bg-gray-900', 'text-white');

    const dayButton = screen.getByText('Day');
    expect(dayButton).not.toHaveClass('bg-gray-900');
  });

  it('calls onViewChange when a view is clicked', () => {
    const onViewChange = vi.fn();
    render(<ViewToggle currentView="weekly" onViewChange={onViewChange} />);

    const dayButton = screen.getByText('Day');
    fireEvent.click(dayButton);

    expect(onViewChange).toHaveBeenCalledWith('daily');
  });

  it('sets correct aria-pressed attribute', () => {
    const onViewChange = vi.fn();
    render(<ViewToggle currentView="monthly" onViewChange={onViewChange} />);

    const monthButton = screen.getByText('Month');
    expect(monthButton).toHaveAttribute('aria-pressed', 'true');

    const dayButton = screen.getByText('Day');
    expect(dayButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('includes aria-label for accessibility', () => {
    const onViewChange = vi.fn();
    render(<ViewToggle currentView="weekly" onViewChange={onViewChange} />);

    const dayButton = screen.getByLabelText('Switch to Day view');
    expect(dayButton).toBeInTheDocument();

    const weekButton = screen.getByLabelText('Switch to Week view');
    expect(weekButton).toBeInTheDocument();

    const monthButton = screen.getByLabelText('Switch to Month view');
    expect(monthButton).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const onViewChange = vi.fn();
    const { container } = render(
      <ViewToggle currentView="weekly" onViewChange={onViewChange} className="custom-class" />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('switches between all views correctly', () => {
    const onViewChange = vi.fn();
    const { rerender } = render(<ViewToggle currentView="daily" onViewChange={onViewChange} />);

    // Switch to weekly
    fireEvent.click(screen.getByText('Week'));
    expect(onViewChange).toHaveBeenCalledWith('weekly');

    rerender(<ViewToggle currentView="weekly" onViewChange={onViewChange} />);

    // Switch to monthly
    fireEvent.click(screen.getByText('Month'));
    expect(onViewChange).toHaveBeenCalledWith('monthly');

    rerender(<ViewToggle currentView="monthly" onViewChange={onViewChange} />);

    // Switch back to daily
    fireEvent.click(screen.getByText('Day'));
    expect(onViewChange).toHaveBeenCalledWith('daily');
  });
});
