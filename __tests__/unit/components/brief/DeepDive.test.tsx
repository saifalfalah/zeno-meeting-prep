import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeepDive } from '@/components/brief/DeepDive';

describe('DeepDive', () => {
  const mockData = {
    whatTheyDo: 'Acme Corp builds enterprise SaaS tools for project management...',
    painPoints: 'Teams struggle with disconnected tools and manual status reporting...',
    howWeFit: 'Our solution provides automated reporting and integrations...',
  };

  it('renders "What They Do" section', () => {
    render(<DeepDive {...mockData} />);
    expect(screen.getByText('What They Do')).toBeInTheDocument();
    expect(screen.getByText(mockData.whatTheyDo)).toBeInTheDocument();
  });

  it('renders "Likely Pain Points" section', () => {
    render(<DeepDive {...mockData} />);
    expect(screen.getByText('Likely Pain Points')).toBeInTheDocument();
    expect(screen.getByText(mockData.painPoints)).toBeInTheDocument();
  });

  it('renders "How We Fit" section', () => {
    render(<DeepDive {...mockData} />);
    expect(screen.getByText('How We Fit')).toBeInTheDocument();
    expect(screen.getByText(mockData.howWeFit)).toBeInTheDocument();
  });

  it('displays "Unknown" for missing data', () => {
    const dataWithMissing = {
      whatTheyDo: null,
      painPoints: null,
      howWeFit: null,
    };
    render(<DeepDive {...dataWithMissing} />);
    const unknownElements = screen.getAllByText('Unknown');
    expect(unknownElements.length).toBe(3);
  });

  it('has proper semantic structure', () => {
    const { container } = render(<DeepDive {...mockData} />);
    const sections = container.querySelectorAll('[data-section]');
    expect(sections.length).toBe(3);
  });
});
