import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorDisplay } from '@/components/brief/ErrorDisplay';

describe('ErrorDisplay Component', () => {
  it('should render error message with retry button', () => {
    const mockOnRetry = () => {};

    render(
      <ErrorDisplay
        errorType="prospect_lookup_failed"
        errorMessage="Failed to find information about the prospect"
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText(/Failed to find information about the prospect/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry research/i })).toBeInTheDocument();
  });

  it('should display specific error type heading', () => {
    render(
      <ErrorDisplay
        errorType="company_lookup_failed"
        errorMessage="Could not retrieve company information"
      />
    );

    expect(screen.getByText(/Company Research Failed/i)).toBeInTheDocument();
  });

  it('should display brief generation error heading', () => {
    render(
      <ErrorDisplay
        errorType="brief_generation_failed"
        errorMessage="Failed to generate research brief"
      />
    );

    expect(screen.getByText(/Brief Generation Failed/i)).toBeInTheDocument();
  });

  it('should display specific error heading for timeout errors', () => {
    render(
      <ErrorDisplay
        errorType="api_timeout"
        errorMessage="Request timed out"
      />
    );

    expect(screen.getByRole('heading', { name: /Request Timed Out/i })).toBeInTheDocument();
  });

  it('should hide retry button when onRetry is not provided', () => {
    render(
      <ErrorDisplay
        errorType="prospect_lookup_failed"
        errorMessage="Failed to find information"
      />
    );

    expect(screen.queryByRole('button', { name: /retry research/i })).not.toBeInTheDocument();
  });

  it('should display helpful suggestion text', () => {
    render(
      <ErrorDisplay
        errorType="rate_limit_exceeded"
        errorMessage="API rate limit exceeded"
      />
    );

    expect(screen.getByText(/Please try again in a few minutes/i)).toBeInTheDocument();
  });

  it('should render with LOW confidence indicator for partial data', () => {
    render(
      <ErrorDisplay
        errorType="partial_data"
        errorMessage="Limited information available"
        confidenceRating="LOW"
      />
    );

    expect(screen.getByRole('status', { name: 'LOW' })).toBeInTheDocument();
    expect(screen.getByText(/Partial Information/i)).toBeInTheDocument();
  });
});
