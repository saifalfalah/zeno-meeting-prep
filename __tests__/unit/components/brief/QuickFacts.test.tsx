import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickFacts } from '@/components/brief/QuickFacts';

describe('QuickFacts', () => {
  const mockData = {
    companyAtAGlance: {
      name: 'Acme Corp',
      industry: 'SaaS',
      employeeCount: '50-200',
      fundingStage: 'Series B',
      headquarters: 'San Francisco, CA',
    },
    prospectAtAGlance: {
      name: 'John Doe',
      title: 'VP of Engineering',
      reportsTo: 'CTO',
      teamSize: '15 engineers',
      background: 'Former AWS engineer, joined 2 years ago',
    },
    recentSignals: [
      { type: 'positive', text: 'Raised $20M Series B funding' },
      { type: 'neutral', text: 'Opened new office in Austin' },
      { type: 'positive', text: 'Launched new product line' },
    ],
  };

  it('renders Company at a Glance section', () => {
    render(<QuickFacts {...mockData} />);
    expect(screen.getByText('Company at a Glance')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('SaaS')).toBeInTheDocument();
    expect(screen.getByText('50-200')).toBeInTheDocument();
    expect(screen.getByText('Series B')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('renders Prospect at a Glance section', () => {
    render(<QuickFacts {...mockData} />);
    expect(screen.getByText('Prospect at a Glance')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('VP of Engineering')).toBeInTheDocument();
    expect(screen.getByText('CTO')).toBeInTheDocument();
    expect(screen.getByText('15 engineers')).toBeInTheDocument();
  });

  it('renders Recent Signals section', () => {
    render(<QuickFacts {...mockData} />);
    expect(screen.getByText('Recent Signals')).toBeInTheDocument();
    expect(screen.getByText('Raised $20M Series B funding')).toBeInTheDocument();
    expect(screen.getByText('Opened new office in Austin')).toBeInTheDocument();
    expect(screen.getByText('Launched new product line')).toBeInTheDocument();
  });

  it('displays "Unknown" for missing company data', () => {
    const dataWithMissing = {
      ...mockData,
      companyAtAGlance: {
        name: null,
        industry: null,
        employeeCount: null,
        fundingStage: null,
        headquarters: null,
      },
    };
    render(<QuickFacts {...dataWithMissing} />);
    const unknownElements = screen.getAllByText('Unknown');
    expect(unknownElements.length).toBeGreaterThanOrEqual(5);
  });

  it('displays "Unknown" for missing prospect data', () => {
    const dataWithMissing = {
      ...mockData,
      prospectAtAGlance: {
        name: null,
        title: null,
        reportsTo: null,
        teamSize: null,
        background: null,
      },
    };
    render(<QuickFacts {...dataWithMissing} />);
    const unknownElements = screen.getAllByText('Unknown');
    expect(unknownElements.length).toBeGreaterThanOrEqual(5);
  });

  it('handles empty recent signals array', () => {
    const dataWithEmpty = {
      ...mockData,
      recentSignals: [],
    };
    render(<QuickFacts {...dataWithEmpty} />);
    expect(screen.getByText('No recent signals')).toBeInTheDocument();
  });

  it('has three distinct boxes', () => {
    const { container } = render(<QuickFacts {...mockData} />);
    const boxes = container.querySelectorAll('[data-box]');
    expect(boxes.length).toBe(3);
  });

  it('displays signal type indicators', () => {
    render(<QuickFacts {...mockData} />);
    // Should have visual indicators for positive/neutral/negative signals
    const { container } = render(<QuickFacts {...mockData} />);
    const positiveSignals = container.querySelectorAll('[data-signal-type="positive"]');
    expect(positiveSignals.length).toBe(2);
  });
});
