import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResearchBriefPage } from '@/components/brief/ResearchBriefPage';

describe('ResearchBriefPage', () => {
  const mockBriefData = {
    header: {
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
    },
    quickFacts: {
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
        background: 'Former AWS engineer',
      },
      recentSignals: [
        { type: 'positive' as const, text: 'Raised $20M funding' },
      ],
    },
    deepDive: {
      whatTheyDo: 'Builds SaaS tools',
      painPoints: 'Disconnected tools',
      howWeFit: 'Automated reporting',
    },
    callStrategy: {
      openingLine: 'I saw you raised funding...',
      discoveryQuestions: ['What are your challenges?'],
      successOutcome: 'Schedule a demo',
      watchOuts: 'May be locked into contract',
    },
    footer: {
      confidenceRating: 'HIGH' as const,
      confidenceExplanation: 'Comprehensive data',
      sources: [
        { type: 'company_website', url: 'https://acme.com', title: 'Company Website' },
      ],
    },
  };

  it('renders all major sections in correct order', () => {
    const { container } = render(<ResearchBriefPage {...mockBriefData} />);

    // Check that sections appear in order
    const sections = container.querySelectorAll('[data-testid]');
    const sectionIds = Array.from(sections).map((el) => el.getAttribute('data-testid'));

    expect(sectionIds).toEqual([
      'header-section',
      'quick-facts-section',
      'deep-dive-section',
      'call-strategy-section',
      'footer-section',
    ]);
  });

  it('renders BriefHeader component', () => {
    render(<ResearchBriefPage {...mockBriefData} />);
    const johnDoeElements = screen.getAllByText('John Doe');
    const acmeCorpElements = screen.getAllByText('Acme Corp');
    expect(johnDoeElements.length).toBeGreaterThan(0);
    expect(acmeCorpElements.length).toBeGreaterThan(0);
  });

  it('renders QuickFacts component', () => {
    render(<ResearchBriefPage {...mockBriefData} />);
    expect(screen.getByText('Company at a Glance')).toBeInTheDocument();
    expect(screen.getByText('Prospect at a Glance')).toBeInTheDocument();
  });

  it('renders DeepDive component', () => {
    render(<ResearchBriefPage {...mockBriefData} />);
    expect(screen.getByText('What They Do')).toBeInTheDocument();
    expect(screen.getByText('Likely Pain Points')).toBeInTheDocument();
  });

  it('renders CallStrategy component', () => {
    render(<ResearchBriefPage {...mockBriefData} />);
    expect(screen.getByText('Opening Line')).toBeInTheDocument();
    expect(screen.getByText('Discovery Questions')).toBeInTheDocument();
  });

  it('renders BriefFooter component', () => {
    render(<ResearchBriefPage {...mockBriefData} />);
    expect(screen.getByText('Confidence: HIGH')).toBeInTheDocument();
  });

  it('has a consistent layout container', () => {
    const { container } = render(<ResearchBriefPage {...mockBriefData} />);
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('max-w-5xl');
  });

  it('applies proper spacing between sections', () => {
    const { container } = render(<ResearchBriefPage {...mockBriefData} />);
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('space-y-6');
  });
});
