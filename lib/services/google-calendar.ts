export interface GoogleCalendar {
  id: string
  summary: string
  primary?: boolean
  accessRole: string
  backgroundColor?: string
  foregroundColor?: string
}

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
    organizer?: boolean
  }>
  location?: string
  hangoutLink?: string
  htmlLink?: string
  status?: string
}

export interface WebhookSubscription {
  id: string
  resourceId: string
  resourceUri: string
  expiration: string // Unix timestamp in milliseconds
}

/**
 * Fetches all calendars for the authenticated user
 */
export async function listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to fetch calendars: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()

  return data.items.map((calendar: Record<string, unknown>) => ({
    id: calendar.id,
    summary: calendar.summary,
    primary: calendar.primary,
    accessRole: calendar.accessRole,
    backgroundColor: calendar.backgroundColor,
    foregroundColor: calendar.foregroundColor,
  }))
}

/**
 * Creates a webhook subscription for calendar events
 * @param calendarId - The Google Calendar ID to watch
 * @param webhookUrl - The public URL where webhook notifications will be sent
 * @param accessToken - Google OAuth access token
 * @returns Webhook subscription details
 */
export async function createWebhookSubscription(
  calendarId: string,
  webhookUrl: string,
  accessToken: string
): Promise<WebhookSubscription> {
  // Generate unique channel ID
  const channelId = `webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        // Expiration: Google requires renewal within 7 days (max)
        // Set to 6 days to ensure renewal before expiration
        expiration: Date.now() + 6 * 24 * 60 * 60 * 1000, // 6 days in milliseconds
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to create webhook subscription: ${error.error?.message || response.statusText}`
    )
  }

  const data = await response.json()

  return {
    id: data.id,
    resourceId: data.resourceId,
    resourceUri: data.resourceUri,
    expiration: data.expiration,
  }
}

/**
 * Stops a webhook subscription
 */
export async function stopWebhookSubscription(
  channelId: string,
  resourceId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/channels/stop',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        resourceId: resourceId,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to stop webhook subscription: ${error.error?.message || response.statusText}`
    )
  }
}

/**
 * Fetches a specific calendar event
 */
export async function getCalendarEvent(
  calendarId: string,
  eventId: string,
  accessToken: string
): Promise<GoogleCalendarEvent> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to fetch calendar event: ${error.error?.message || response.statusText}`
    )
  }

  return response.json()
}

/**
 * Lists calendar events within a time range
 */
export async function listCalendarEvents(
  calendarId: string,
  accessToken: string,
  options?: {
    timeMin?: string // ISO 8601 format
    timeMax?: string // ISO 8601 format
    maxResults?: number
    singleEvents?: boolean // Expand recurring events
  }
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    ...(options?.timeMin && { timeMin: options.timeMin }),
    ...(options?.timeMax && { timeMax: options.timeMax }),
    ...(options?.maxResults && { maxResults: options.maxResults.toString() }),
    ...(options?.singleEvents !== undefined && { singleEvents: options.singleEvents.toString() }),
  })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to list calendar events: ${error.error?.message || response.statusText}`
    )
  }

  const data = await response.json()
  return data.items || []
}

/**
 * Checks if an email is external (not from the company domain)
 */
export function isExternalEmail(email: string, companyDomain: string): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase()
  const cleanCompanyDomain = companyDomain.toLowerCase().trim()

  return emailDomain !== cleanCompanyDomain
}

/**
 * Filters attendees to only include external participants
 */
export function getExternalAttendees(
  attendees: GoogleCalendarEvent['attendees'],
  companyDomain: string
): Array<{ email: string; displayName?: string; responseStatus?: string }> {
  if (!attendees || attendees.length === 0) {
    return []
  }

  return attendees.filter(
    (attendee) => !attendee.organizer && isExternalEmail(attendee.email, companyDomain)
  )
}

/**
 * Verifies that the webhook URL is publicly accessible
 * This is called before creating a campaign to ensure webhooks will work
 */
export async function verifyWebhookUrl(webhookUrl: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'HEAD',
      // Use a short timeout to fail fast
      signal: AbortSignal.timeout(5000),
    })

    // We expect a 200 or 405 (Method Not Allowed) for HEAD requests
    // 405 is acceptable because the endpoint might only accept POST
    return response.ok || response.status === 405
  } catch (error) {
    console.error('Webhook URL verification failed:', error)
    return false
  }
}
