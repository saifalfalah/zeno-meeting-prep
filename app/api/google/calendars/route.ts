import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { listCalendars } from '@/lib/services/google-calendar'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.access_token) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    if (session.error === 'RefreshAccessTokenError') {
      return NextResponse.json(
        { error: 'Token refresh failed - Please re-authenticate' },
        { status: 401 }
      )
    }

    const calendars = await listCalendars(session.access_token)

    return NextResponse.json({ calendars })
  } catch (error) {
    console.error('Failed to fetch calendars:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch calendars',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
