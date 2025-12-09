import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BriefFooter } from '@/components/brief/BriefFooter';

describe('BriefFooter', () => {
  const mockData = {
    confidenceRating: 'HIGH' as const,
    confidenceExplanation: 'Based on comprehensive data from multiple sources',
    sources: [
      { type: 'company_website', url: 'https://acme.com', title: 'Company Website' },
      { type: 'crunchbase', url: 'https://crunchbase.com/acme', title: 'Crunchbase Profile' },
      { type: 'linkedin', url: 'https://linkedin.com/company/acme', title: 'LinkedIn' },
    ],
  };

  it('renders confidence rating', () => {
    render(<BriefFooter {...mockData} />);
    expect(screen.getByText('Confidence: HIGH')).toBeInTheDocument();
  });

  it('renders confidence explanation', () => {
    render(<BriefFooter {...mockData} />);
    expect(screen.getByText(mockData.confidenceExplanation)).toBeInTheDocument();
  });

  it('renders all sources with clickable URLs', () => {
    render(<BriefFooter {...mockData} />);
    mockData.sources.forEach((source) => {
      const link = screen.getByRole('link', { name: source.title });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', source.url);
    });
  });

  it('displays different confidence colors', () => {
    const { container, rerender } = render(<BriefFooter {...mockData} />);

    // HIGH should be green
    let badge = container.querySelector('[data-confidence]');
    expect(badge).toHaveClass('bg-green-100');

    // MEDIUM should be yellow
    rerender(<BriefFooter {...mockData} confidenceRating="MEDIUM" />);
    badge = container.querySelector('[data-confidence]');
    expect(badge).toHaveClass('bg-yellow-100');

    // LOW should be red
    rerender(<BriefFooter {...mockData} confidenceRating="LOW" />);
    badge = container.querySelector('[data-confidence]');
    expect(badge).toHaveClass('bg-red-100');
  });

  it('handles empty sources array', () => {
    const dataWithoutSources = {
      ...mockData,
      sources: [],
    };
    render(<BriefFooter {...dataWithoutSources} />);
    expect(screen.getByText('No sources available')).toBeInTheDocument();
  });

  it('opens source links in new tab', () => {
    render(<BriefFooter {...mockData} />);
    mockData.sources.forEach((source) => {
      const link = screen.getByRole('link', { name: source.title });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('has proper semantic structure with sections', () => {
    const { container } = render(<BriefFooter {...mockData} />);
    const confidenceSection = container.querySelector('[data-section="confidence"]');
    const sourcesSection = container.querySelector('[data-section="sources"]');
    expect(confidenceSection).toBeInTheDocument();
    expect(sourcesSection).toBeInTheDocument();
  });
});
