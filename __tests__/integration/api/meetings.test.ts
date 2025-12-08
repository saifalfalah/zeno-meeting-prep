import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/meetings/route';
import { NextRequest } from 'next/server';

// Mock the auth module
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

// Mock the database queries
vi.mock('@/lib/db/queries/meetings', () => ({
  getMeetingsByCampaignId: vi.fn(),
  getMeetingsByDateRange: vi.fn(),
}));

import { auth } from '@/lib/auth/config';
import { getMeetingsByCampaignId, getMeetingsByDateRange } from '@/lib/db/queries/meetings';

describe('GET /api/meetings', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  };

  const mockMeetings = [
    {
      id: 'meeting-1',
      title: 'Product Demo',
      description: 'Demo for client',
      startTime: new Date('2025-12-10T14:00:00Z'),
      endTime: new Date('2025-12-10T15:00:00Z'),
      timezone: 'America/Los_Angeles',
      location: null,
      meetLink: 'https://meet.google.com/abc',
      status: 'scheduled',
      researchStatus: 'ready',
      researchBriefId: 'brief-1',
      researchFailureReason: null,
      hasExternalAttendees: true,
      meetingProspects: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/meetings?campaignId=campaign-1')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when campaignId is missing', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);

    const request = new NextRequest(new URL('http://localhost:3000/api/meetings'));

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('campaignId is required');
  });

  it('fetches all meetings for a campaign when no date range provided', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(getMeetingsByCampaignId).mockResolvedValue(mockMeetings as any);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/meetings?campaignId=campaign-1')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getMeetingsByCampaignId).toHaveBeenCalledWith('campaign-1');
    expect(data.meetings).toHaveLength(1);
    expect(data.meetings[0].id).toBe('meeting-1');
    expect(data.count).toBe(1);
  });

  it('fetches meetings by date range when provided', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(getMeetingsByDateRange).mockResolvedValue(mockMeetings as any);

    const startDate = '2025-12-10T00:00:00Z';
    const endDate = '2025-12-10T23:59:59Z';

    const request = new NextRequest(
      new URL(
        `http://localhost:3000/api/meetings?campaignId=campaign-1&startDate=${startDate}&endDate=${endDate}`
      )
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getMeetingsByDateRange).toHaveBeenCalledWith(
      'campaign-1',
      new Date(startDate),
      new Date(endDate)
    );
    expect(data.meetings).toHaveLength(1);
  });

  it('returns 400 for invalid date format', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);

    const request = new NextRequest(
      new URL(
        'http://localhost:3000/api/meetings?campaignId=campaign-1&startDate=invalid&endDate=2025-12-10'
      )
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid date format');
  });

  it('transforms meeting data correctly', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(getMeetingsByCampaignId).mockResolvedValue(mockMeetings as any);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/meetings?campaignId=campaign-1')
    );

    const response = await GET(request);
    const data = await response.json();

    const meeting = data.meetings[0];
    expect(meeting.startTime).toBe('2025-12-10T14:00:00.000Z');
    expect(meeting.endTime).toBe('2025-12-10T15:00:00.000Z');
    expect(meeting.prospects).toEqual([]);
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(getMeetingsByCampaignId).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      new URL('http://localhost:3000/api/meetings?campaignId=campaign-1')
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
