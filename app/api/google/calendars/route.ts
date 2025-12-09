import { NextResponse } from 'next/server'
import { validateGoogleSession } from '@/lib/auth/session-utils'
import { listCalendars } from '@/lib/services/google-calendar'

export async function GET() {
  try {
    // Validate session has Google access token
    const validation = await validateGoogleSession()

    if (!validation.isValid) {
      console.error('[Calendar API] Session validation failed:', {
        error: validation.error,
        message: validation.message
      })
      return NextResponse.json(
        {
          error: validation.error,
          message: validation.message,
          requiresReauth: validation.requiresReauth
        },
        { status: 401 }
      )
    }

    const session = validation.session!

    // Fetch calendars from Google
    const calendars = await listCalendars(session.access_token)

    console.log(`[Calendar API] Successfully fetched ${calendars.length} calendars for user ${session.user?.email}`)

    return NextResponse.json({ calendars })
  } catch (error) {
    console.error('[Calendar API] Failed to fetch calendars:', error)

    // Check if it's a Google API error
    if (error instanceof Error && error.message.includes('Failed to fetch calendars')) {
      return NextResponse.json(
        {
          error: 'GOOGLE_API_ERROR',
          message: error.message,
          requiresReauth: error.message.includes('401') || error.message.includes('unauthorized')
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        requiresReauth: false
      },
      { status: 500 }
    )
  }
}
