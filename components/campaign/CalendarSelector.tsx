'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { CampaignFormData } from './SetupWizard'

export interface CalendarSelectorProps {
  initialData: Partial<CampaignFormData>
  onNext: (data: Partial<CampaignFormData>) => void
  onCancel: () => void
}

export interface GoogleCalendar {
  id: string
  summary: string
  primary?: boolean
  accessRole: string
}

export function CalendarSelector({ initialData, onNext, onCancel }: CalendarSelectorProps) {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState(initialData.googleCalendarId || '')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCalendars()
  }, [])

  const fetchCalendars = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/google/calendars')

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          throw new Error(errorData.error || 'Authentication failed. Please sign out and sign in again.')
        }
        throw new Error(errorData.error || 'Failed to fetch calendars')
      }

      const data = await response.json()
      setCalendars(data.calendars || [])

      // Auto-select primary calendar if no selection
      if (!selectedCalendarId && data.calendars.length > 0) {
        const primaryCalendar = data.calendars.find((cal: GoogleCalendar) => cal.primary)
        if (primaryCalendar) {
          setSelectedCalendarId(primaryCalendar.id)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendars')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (!selectedCalendarId) {
      setError('Please select a calendar')
      return
    }

    const selectedCalendar = calendars.find(cal => cal.id === selectedCalendarId)

    onNext({
      googleCalendarId: selectedCalendarId,
      googleCalendarName: selectedCalendar?.summary || 'Unknown Calendar',
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Select Calendar</h2>
      <p className="text-gray-600 mb-6">
        Choose the Google Calendar we should monitor for new meetings with external attendees.
      </p>

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading your calendars...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">{error}</p>
          {error.includes('Authentication failed') && (
            <button
              onClick={() => signOut()}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Sign out and try again
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && calendars.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
          No calendars found. Please ensure you've granted calendar access.
        </div>
      )}

      {!isLoading && calendars.length > 0 && (
        <div className="space-y-3 mb-6">
          {calendars.map((calendar) => (
            <label
              key={calendar.id}
              className={`
                block p-4 border-2 rounded-lg cursor-pointer transition-all
                ${selectedCalendarId === calendar.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="calendar"
                  value={calendar.id}
                  checked={selectedCalendarId === calendar.id}
                  onChange={(e) => setSelectedCalendarId(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{calendar.summary}</span>
                    {calendar.primary && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{calendar.accessRole}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedCalendarId || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}
