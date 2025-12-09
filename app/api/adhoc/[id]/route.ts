import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client'
import { users, adHocResearchRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  getAdHocResearchRequestById,
  deleteAdHocResearchRequest,
} from '@/lib/db/queries/adhoc'

/**
 * GET /api/adhoc/[id]
 * Gets a specific ad-hoc research request with full brief details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get ad-hoc research request with full details
    const adhocRequest = await getAdHocResearchRequestById(id)

    if (!adhocRequest) {
      return NextResponse.json(
        { error: 'Ad-hoc research request not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (adhocRequest.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this research request' },
        { status: 403 }
      )
    }

    return NextResponse.json({ request: adhocRequest })
  } catch (error) {
    console.error('Failed to fetch ad-hoc research request:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch ad-hoc research request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/adhoc/[id]
 * Deletes an ad-hoc research request (calendar-based briefs cannot be deleted)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get ad-hoc research request
    const adhocRequest = await db.query.adHocResearchRequests.findFirst({
      where: eq(adHocResearchRequests.id, id),
    })

    if (!adhocRequest) {
      return NextResponse.json(
        { error: 'Ad-hoc research request not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (adhocRequest.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this research request' },
        { status: 403 }
      )
    }

    // Prevent deletion if research is currently generating
    if (adhocRequest.status === 'generating') {
      return NextResponse.json(
        {
          error: 'Cannot delete research request while it is being generated',
        },
        { status: 400 }
      )
    }

    // Delete the ad-hoc research request
    await deleteAdHocResearchRequest(id)

    return NextResponse.json(
      { message: 'Ad-hoc research request deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to delete ad-hoc research request:', error)

    return NextResponse.json(
      {
        error: 'Failed to delete ad-hoc research request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
