import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { inngest } from '@/lib/inngest/client';
import { db } from '@/lib/db/client';
import { meetings, adHocResearchRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Manually trigger research for a meeting or ad-hoc request
 *
 * POST /api/research/trigger
 * Body: { type: 'calendar' | 'adhoc', meetingId?: string, adHocRequestId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, meetingId, adHocRequestId } = body;

    if (!type || (type !== 'calendar' && type !== 'adhoc')) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "calendar" or "adhoc"' },
        { status: 400 }
      );
    }

    if (type === 'calendar') {
      if (!meetingId) {
        return NextResponse.json(
          { error: 'meetingId is required for calendar type' },
          { status: 400 }
        );
      }

      // Fetch meeting with prospects
      const meeting = await db.query.meetings.findFirst({
        where: eq(meetings.id, meetingId),
        with: {
          campaign: true,
          meetingProspects: {
            with: {
              prospect: true,
            },
          },
        },
      });

      if (!meeting) {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      }

      // Verify user owns this meeting's campaign
      if (meeting.campaign.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Update status to pending
      await db.update(meetings)
        .set({
          researchStatus: 'pending',
          researchFailureReason: null,
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, meetingId));

      // Trigger research
      await inngest.send({
        name: 'research/generate.requested',
        data: {
          type: 'calendar',
          meetingId,
          campaignId: meeting.campaignId,
          prospects: meeting.meetingProspects.map((mp) => ({
            email: mp.prospect.email,
            name: mp.prospect.name || undefined,
            companyDomain: undefined,
          })),
          requestedAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Research triggered for meeting',
        meetingId,
      });
    } else {
      // type === 'adhoc'
      if (!adHocRequestId) {
        return NextResponse.json(
          { error: 'adHocRequestId is required for adhoc type' },
          { status: 400 }
        );
      }

      // Fetch ad-hoc request
      const adhocRequest = await db.query.adHocResearchRequests.findFirst({
        where: eq(adHocResearchRequests.id, adHocRequestId),
        with: {
          campaign: true,
        },
      });

      if (!adhocRequest) {
        return NextResponse.json({ error: 'Ad-hoc request not found' }, { status: 404 });
      }

      // Verify user owns this request
      if (adhocRequest.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Update status to pending
      await db.update(adHocResearchRequests)
        .set({
          status: 'pending',
          failureReason: null,
          updatedAt: new Date(),
        })
        .where(eq(adHocResearchRequests.id, adHocRequestId));

      // Build prospects array from ad-hoc request data
      const prospects = [];
      if (adhocRequest.email) {
        prospects.push({
          email: adhocRequest.email,
          name: adhocRequest.prospectName || undefined,
          companyDomain: undefined,
        });
      }

      // Trigger research
      await inngest.send({
        name: 'research/generate.requested',
        data: {
          type: 'adhoc',
          adHocRequestId,
          campaignId: adhocRequest.campaignId,
          prospects,
          requestedAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Research triggered for ad-hoc request',
        adHocRequestId,
      });
    }
  } catch (error) {
    console.error('Research trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger research' },
      { status: 500 }
    );
  }
}
