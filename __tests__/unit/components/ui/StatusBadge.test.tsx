import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/StatusBadge';

describe('StatusBadge', () => {
  it('renders "No Research" for none status', () => {
    render(<StatusBadge status="none" />);
    expect(screen.getByText('No Research')).toBeInTheDocument();
  });

  it('renders "Queued" for pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Queued')).toBeInTheDocument();
  });

  it('renders "Researching..." for generating status', () => {
    render(<StatusBadge status="generating" />);
    expect(screen.getByText('Researching...')).toBeInTheDocument();
  });

  it('renders "Ready" for ready status', () => {
    render(<StatusBadge status="ready" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders "Failed" for failed status', () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBadge status="ready" className="custom-class" />);
    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });

  it('uses correct variant for each status', () => {
    const { rerender, container } = render(<StatusBadge status="none" />);
    expect(container.firstChild).toHaveClass('bg-gray-100', 'text-gray-800');

    rerender(<StatusBadge status="pending" />);
    expect(container.firstChild).toHaveClass('bg-blue-100', 'text-blue-800');

    rerender(<StatusBadge status="generating" />);
    expect(container.firstChild).toHaveClass('bg-yellow-100', 'text-yellow-800');

    rerender(<StatusBadge status="ready" />);
    expect(container.firstChild).toHaveClass('bg-green-100', 'text-green-800');

    rerender(<StatusBadge status="failed" />);
    expect(container.firstChild).toHaveClass('bg-red-100', 'text-red-800');
  });
});
