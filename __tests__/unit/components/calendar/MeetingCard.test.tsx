import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MeetingCard } from '@/components/calendar/MeetingCard';

describe('MeetingCard', () => {
  const mockMeeting = {
    id: 'meeting-123',
    title: 'Product Demo',
    startTime: new Date('2025-12-10T14:00:00Z'),
    endTime: new Date('2025-12-10T15:00:00Z'),
    timezone: 'America/Los_Angeles',
    researchStatus: 'ready' as const,
  };

  it('renders meeting title', () => {
    render(<MeetingCard {...mockMeeting} />);
    expect(screen.getByText('Product Demo')).toBeInTheDocument();
  });

  it('renders meeting time range', () => {
    render(<MeetingCard {...mockMeeting} />);
    // Time format will depend on timezone, but should contain AM/PM
    const timeText = screen.getByText(/AM|PM/);
    expect(timeText).toBeInTheDocument();
  });

  it('renders research status badge', () => {
    render(<MeetingCard {...mockMeeting} />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders location when provided', () => {
    render(<MeetingCard {...mockMeeting} location="Conference Room A" />);
    expect(screen.getByText('Conference Room A')).toBeInTheDocument();
  });

  it('renders "Video call" when meetLink is provided', () => {
    render(<MeetingCard {...mockMeeting} meetLink="https://meet.google.com/abc-def-ghi" />);
    expect(screen.getByText('Video call')).toBeInTheDocument();
  });

  it('prefers meetLink over location', () => {
    render(
      <MeetingCard
        {...mockMeeting}
        location="Conference Room A"
        meetLink="https://meet.google.com/abc-def-ghi"
      />
    );
    expect(screen.getByText('Video call')).toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
  });

  it('renders link to meeting detail page', () => {
    render(<MeetingCard {...mockMeeting} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/meetings/meeting-123');
  });

  it('shows relative time for upcoming meetings', () => {
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    render(
      <MeetingCard
        {...mockMeeting}
        startTime={futureTime}
        endTime={new Date(futureTime.getTime() + 3600000)}
      />
    );

    // Should show "in 2h" or similar
    const relativeTime = screen.getByText(/in \d+/);
    expect(relativeTime).toBeInTheDocument();
  });

  it('shows "Past" for past meetings', () => {
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 2);

    render(
      <MeetingCard
        {...mockMeeting}
        startTime={pastTime}
        endTime={new Date(pastTime.getTime() + 3600000)}
      />
    );

    expect(screen.getByText('Past')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<MeetingCard {...mockMeeting} className="custom-class" />);
    const link = container.querySelector('.custom-class');
    expect(link).toBeInTheDocument();
  });

  it('renders time icons', () => {
    const { container } = render(<MeetingCard {...mockMeeting} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
