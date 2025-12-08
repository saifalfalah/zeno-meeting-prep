import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CampaignFilter } from '@/components/calendar/CampaignFilter';

describe('CampaignFilter', () => {
  const mockCampaigns = [
    { id: 'campaign-1', name: 'Q4 Sales Campaign' },
    { id: 'campaign-2', name: 'Product Launch 2025' },
    { id: 'campaign-3', name: 'Customer Outreach' },
  ];

  it('renders with "All Campaigns" when nothing is selected', () => {
    const onCampaignChange = vi.fn();
    render(
      <CampaignFilter
        campaigns={mockCampaigns}
        selectedCampaignId={null}
        onCampaignChange={onCampaignChange}
      />
    );

    expect(screen.getByText('All Campaigns')).toBeInTheDocument();
  });

  it('renders selected campaign name', () => {
    const onCampaignChange = vi.fn();
    render(
      <CampaignFilter
        campaigns={mockCampaigns}
        selectedCampaignId="campaign-2"
        onCampaignChange={onCampaignChange}
      />
    );

    expect(screen.getByText('Product Launch 2025')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    const onCampaignChange = vi.fn();
    render(
      <CampaignFilter
        campaigns={mockCampaigns}
        selectedCampaignId={null}
        onCampaignChange={onCampaignChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // All campaigns should be visible
    expect(screen.getAllByText('All Campaigns')).toHaveLength(2); // Button text + dropdown option
    expect(screen.getByText('Q4 Sales Campaign')).toBeInTheDocument();
    expect(screen.getByText('Product Launch 2025')).toBeInTheDocument();
    expect(screen.getByText('Customer Outreach')).toBeInTheDocument();
  });

  it('calls onCampaignChange when a campaign is selected', () => {
    const onCampaignChange = vi.fn();
    render(
      <CampaignFilter
        campaigns={mockCampaigns}
        selectedCampaignId={null}
        onCampaignChange={onCampaignChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Click on a campaign
    const campaignOptions = screen.getAllByRole('option');
    const q4Campaign = campaignOptions.find((opt) => opt.textContent === 'Q4 Sales Campaign');
    fireEvent.click(q4Campaign!);

    expect(onCampaignChange).toHaveBeenCalledWith('campaign-1');
  });

  it('calls onCampaignChange with null when "All Campaigns" is selected', () => {
    const onCampaignChange = vi.fn();
    render(
      <CampaignFilter
        campaigns={mockCampaigns}
        selectedCampaignId="campaign-1"
        onCampaignChange={onCampaignChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Click on "All Campaigns" option in dropdown
    const options = screen.getAllByRole('option');
    const allCampaignsOption = options.find((opt) => opt.textContent === 'All Campaigns');
    fireEvent.click(allCampaignsOption!);

    expect(onCampaignChange).toHaveBeenCalledWith(null);
  });

  it('closes dropdown after selection', () => {
    const onCampaignChange = vi.fn();
    const { container } = render(
      <CampaignFilter
        campaigns={mockCampaigns}
        selectedCampaignId={null}
        onCampaignChange={onCampaignChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Verify dropdown is open
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Select a campaign
    const campaignOptions = screen.getAllByRole('option');
    fireEvent.click(campaignOptions[1]); // Select first campaign

    // Dropdown should close
    expect(container.querySelector('[role="listbox"]')).not.toBeInTheDocument();
  });

  it('shows "No campaigns available" when campaigns array is empty', () => {
    const onCampaignChange = vi.fn();
    render(
      <CampaignFilter
        campaigns={[]}
        selectedCampaignId={null}
        onCampaignChange={onCampaignChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('No campaigns available')).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    const onCampaignChange = vi.fn();
    render(
      <CampaignFilter
        campaigns={mockCampaigns}
        selectedCampaignId={null}
        onCampaignChange={onCampaignChange}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    // Open dropdown
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('highlights selected campaign in dropdown', () => {
    const onCampaignChange = vi.fn();
    render(
      <CampaignFilter
        campaigns={mockCampaigns}
        selectedCampaignId="campaign-2"
        onCampaignChange={onCampaignChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    const options = screen.getAllByRole('option');
    const selectedOption = options.find((opt) => opt.textContent === 'Product Launch 2025');

    expect(selectedOption).toHaveClass('bg-blue-50', 'text-blue-600');
    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  });

  it('applies custom className', () => {
    const onCampaignChange = vi.fn();
    const { container } = render(
      <CampaignFilter
        campaigns={mockCampaigns}
        selectedCampaignId={null}
        onCampaignChange={onCampaignChange}
        className="custom-class"
      />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });
});
