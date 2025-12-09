import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client'
import { meetings, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { inngest } from '@/lib/inngest/client'
import { z } from 'zod'

const triggerResearchSchema = z.object({
  meetingId: z.string().uuid(),
})

/**
 * POST /api/research/trigger
 * Manually triggers research generation for a meeting
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { meetingId } = triggerResearchSchema.parse(body)

    // Get meeting and verify ownership
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.id, meetingId),
      with: {
        campaign: true,
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    if (meeting.campaign.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Meeting belongs to different user' },
        { status: 403 }
      )
    }

    // Check if research is already in progress
    if (meeting.researchStatus === 'generating') {
      return NextResponse.json(
        { error: 'Research is already in progress' },
        { status: 409 }
      )
    }

    // Update status to pending
    await db
      .update(meetings)
      .set({
        researchStatus: 'pending',
        researchFailureReason: null,
      })
      .where(eq(meetings.id, meetingId))

    // Trigger research generation
    await inngest.send({
      name: 'research/generate.requested',
      data: {
        meetingId: meeting.id,
        campaignId: meeting.campaignId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Research generation triggered',
      meetingId: meeting.id,
    })
  } catch (error) {
    console.error('Failed to trigger research:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to trigger research',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
