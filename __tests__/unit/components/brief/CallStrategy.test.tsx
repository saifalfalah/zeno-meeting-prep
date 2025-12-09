import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CallStrategy } from '@/components/brief/CallStrategy';

describe('CallStrategy', () => {
  const mockData = {
    openingLine: 'I saw you recently raised Series B funding...',
    discoveryQuestions: [
      'What are your biggest challenges with current tools?',
      'How does your team currently handle reporting?',
      'What would success look like for you?',
    ],
    successOutcome: 'Prospect agrees to schedule a technical demo...',
    watchOuts: 'May be locked into 2-year contract with competitor...',
  };

  it('renders Opening Line box', () => {
    render(<CallStrategy {...mockData} />);
    expect(screen.getByText('Opening Line')).toBeInTheDocument();
    expect(screen.getByText(mockData.openingLine)).toBeInTheDocument();
  });

  it('renders Discovery Questions box with all questions', () => {
    render(<CallStrategy {...mockData} />);
    expect(screen.getByText('Discovery Questions')).toBeInTheDocument();
    mockData.discoveryQuestions.forEach((question) => {
      expect(screen.getByText(question)).toBeInTheDocument();
    });
  });

  it('renders Success Outcome box', () => {
    render(<CallStrategy {...mockData} />);
    expect(screen.getByText('Success Outcome')).toBeInTheDocument();
    expect(screen.getByText(mockData.successOutcome)).toBeInTheDocument();
  });

  it('renders Watch Out For box', () => {
    render(<CallStrategy {...mockData} />);
    expect(screen.getByText('Watch Out For')).toBeInTheDocument();
    expect(screen.getByText(mockData.watchOuts)).toBeInTheDocument();
  });

  it('displays "Unknown" for missing data', () => {
    const dataWithMissing = {
      openingLine: null,
      discoveryQuestions: [],
      successOutcome: null,
      watchOuts: null,
    };
    render(<CallStrategy {...dataWithMissing} />);
    const unknownElements = screen.getAllByText('Unknown');
    expect(unknownElements.length).toBeGreaterThanOrEqual(3);
  });

  it('has four distinct boxes', () => {
    const { container } = render(<CallStrategy {...mockData} />);
    const boxes = container.querySelectorAll('[data-box]');
    expect(boxes.length).toBe(4);
  });

  it('displays numbered list for discovery questions', () => {
    const { container } = render(<CallStrategy {...mockData} />);
    const listItems = container.querySelectorAll('ol li');
    expect(listItems.length).toBe(3);
  });
});
