import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdHocForm, type AdHocFormProps } from '@/components/adhoc/AdHocForm';

describe('AdHocForm - Website Field (User Story 2)', () => {
  const mockCampaigns = [
    { id: 'campaign-1', name: 'Q4 Enterprise' },
    { id: 'campaign-2', name: 'SMB Outreach' },
  ];

  let mockOnSubmit: ReturnType<typeof vi.fn>;
  let defaultProps: AdHocFormProps;

  beforeEach(() => {
    mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    defaultProps = {
      campaigns: mockCampaigns,
      onSubmit: mockOnSubmit,
      isSubmitting: false,
    };
  });

  describe('T031: Website field validation', () => {
    it('should render website input field with proper label and placeholder', () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      expect(websiteInput).toBeInTheDocument();
      expect(websiteInput).toHaveAttribute('type', 'text');
      expect(websiteInput).toHaveAttribute('placeholder');
    });

    it('should validate valid URL formats (https://)', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'https://example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            website: 'https://example.com',
          })
        );
      });
    });

    it('should validate valid URL formats (http://)', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'http://example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            website: 'http://example.com',
          })
        );
      });
    });

    it('should validate bare domain format (example.com)', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            website: 'example.com',
          })
        );
      });
    });

    it('should reject invalid URL formats', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'not-a-valid-url' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.queryByText(/valid website url/i);
        expect(errorMessage).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear website field error when user corrects input', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      // Enter invalid URL
      fireEvent.change(websiteInput, { target: { value: 'invalid' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/valid website url/i)).toBeInTheDocument();
      });

      // Correct the URL
      fireEvent.change(websiteInput, { target: { value: 'https://example.com' } });

      await waitFor(() => {
        expect(screen.queryByText(/valid website url/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('T032: Form submission with website only', () => {
    it('should allow submission with only website field populated', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'https://acme.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          website: 'https://acme.com',
          campaignId: 'campaign-1',
          prospectName: undefined,
          companyName: undefined,
          email: undefined,
        });
      });
    });

    it('should not show form-level error when only website is provided', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'https://example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      expect(screen.queryByText(/please provide at least one field/i)).not.toBeInTheDocument();
    });

    it('should show error when no fields are provided (including website)', async () => {
      render(<AdHocForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /generate/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.queryByText(/please provide at least one field/i);
        expect(errorMessage).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('T033: URL format normalization', () => {
    it('should handle www prefix in URLs', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'www.example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            website: 'www.example.com',
          })
        );
      });
    });

    it('should handle URLs with paths', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'https://example.com/about' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            website: 'https://example.com/about',
          })
        );
      });
    });

    it('should trim whitespace from website input', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: '  https://example.com  ' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            website: 'https://example.com',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association for website field', () => {
      render(<AdHocForm {...defaultProps} />);

      const label = screen.getByText(/website/i);
      const input = screen.getByLabelText(/website/i);

      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect(label.getAttribute('for')).toBe(input.id);
    });

    it('should have helper text explaining prioritization', () => {
      render(<AdHocForm {...defaultProps} />);

      const helperText = screen.queryByText(/prioritized over email domain/i);
      expect(helperText).toBeInTheDocument();
    });

    it('should disable website input when form is submitting', () => {
      render(<AdHocForm {...defaultProps} isSubmitting={true} />);

      const websiteInput = screen.getByLabelText(/website/i);
      expect(websiteInput).toBeDisabled();
    });
  });

  describe('Integration with other fields', () => {
    it('should submit both website and email when provided', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'https://acme.com' } });
      fireEvent.change(emailInput, { target: { value: 'john@acme.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          website: 'https://acme.com',
          email: 'john@acme.com',
          campaignId: 'campaign-1',
          prospectName: undefined,
          companyName: undefined,
        });
      });
    });

    it('should submit all fields when provided', async () => {
      render(<AdHocForm {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/website/i);
      const emailInput = screen.getByLabelText(/email/i);
      const prospectInput = screen.getByLabelText(/prospect name/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const submitButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(websiteInput, { target: { value: 'https://acme.com' } });
      fireEvent.change(emailInput, { target: { value: 'john@acme.com' } });
      fireEvent.change(prospectInput, { target: { value: 'John Doe' } });
      fireEvent.change(companyInput, { target: { value: 'Acme Corp' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          website: 'https://acme.com',
          email: 'john@acme.com',
          prospectName: 'John Doe',
          companyName: 'Acme Corp',
          campaignId: 'campaign-1',
        });
      });
    });
  });
});
