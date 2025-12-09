import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BriefHeader } from '@/components/brief/BriefHeader';

describe('BriefHeader', () => {
  const mockData = {
    prospect: {
      name: 'John Doe',
      title: 'VP of Engineering',
      location: 'San Francisco, CA',
    },
    company: {
      name: 'Acme Corp',
      industry: 'SaaS',
      size: '50-200 employees',
    },
    meeting: {
      title: 'Discovery Call',
      startTime: '2025-12-10T10:00:00Z',
      campaign: 'Q4 Enterprise',
      duration: '30 min',
    },
  };

  it('renders prospect information correctly', () => {
    render(<BriefHeader {...mockData} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('VP of Engineering')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('renders company information correctly', () => {
    render(<BriefHeader {...mockData} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('SaaS')).toBeInTheDocument();
    expect(screen.getByText('50-200 employees')).toBeInTheDocument();
  });

  it('renders meeting information correctly', () => {
    render(<BriefHeader {...mockData} />);
    expect(screen.getByText('Discovery Call')).toBeInTheDocument();
    expect(screen.getByText('Q4 Enterprise')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('displays "Unknown" for missing prospect data', () => {
    const dataWithMissing = {
      ...mockData,
      prospect: {
        name: null,
        title: null,
        location: null,
      },
    };
    render(<BriefHeader {...dataWithMissing} />);
    const unknownElements = screen.getAllByText('Unknown');
    expect(unknownElements.length).toBeGreaterThanOrEqual(3);
  });

  it('displays "Unknown" for missing company data', () => {
    const dataWithMissing = {
      ...mockData,
      company: {
        name: null,
        industry: null,
        size: null,
      },
    };
    render(<BriefHeader {...dataWithMissing} />);
    const unknownElements = screen.getAllByText('Unknown');
    expect(unknownElements.length).toBeGreaterThanOrEqual(3);
  });

  it('formats meeting start time correctly', () => {
    render(<BriefHeader {...mockData} />);
    // Should display formatted date/time
    expect(screen.getByText(/Dec/i)).toBeInTheDocument();
  });

  it('has three distinct column sections', () => {
    const { container } = render(<BriefHeader {...mockData} />);
    // Should have 3 main sections: prospect | company | meeting
    const sections = container.querySelectorAll('[data-section]');
    expect(sections.length).toBe(3);
  });

  it('applies mobile-responsive classes', () => {
    const { container } = render(<BriefHeader {...mockData} />);
    // Should have responsive grid layout
    expect(container.firstChild).toHaveClass('grid');
  });
});
