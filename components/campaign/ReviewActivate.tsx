'use client'

import { CampaignFormData } from './SetupWizard'

export interface ReviewActivateProps {
  data: CampaignFormData
  onSubmit: (data: Partial<CampaignFormData>) => Promise<void>
  onBack: () => void
  isSubmitting: boolean
}

export function ReviewActivate({ data, onSubmit, onBack, isSubmitting }: ReviewActivateProps) {
  const handleSubmit = async () => {
    await onSubmit({})
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Review & Activate</h2>
      <p className="text-gray-600 mb-6">
        Review your campaign details and click "Activate Campaign" to start monitoring your calendar.
      </p>

      <div className="space-y-6">
        {/* Calendar Section */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-3">Calendar</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{data.googleCalendarName}</p>
                <p className="text-sm text-gray-600">{data.googleCalendarId}</p>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="text-blue-600 hover:underline text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Company Section */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-3">Company</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <p className="text-sm text-gray-600">Company Name</p>
              <p className="font-medium">{data.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Domain</p>
              <p className="font-medium">{data.companyDomain}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium">{data.companyDescription}</p>
            </div>
          </div>
        </div>

        {/* Offering Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Offering</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <p className="text-sm text-gray-600">Title</p>
              <p className="font-medium">{data.offeringTitle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium">{data.offeringDescription}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Target Customer</p>
              <p className="font-medium">{data.targetCustomer}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pain Points</p>
              <ul className="list-disc list-inside space-y-1">
                {data.keyPainPoints?.map((painPoint, index) => (
                  <li key={index} className="font-medium">{painPoint}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>We'll connect to your Google Calendar and set up webhook notifications</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>When you schedule meetings with external attendees, we'll automatically detect them</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Research briefs will be generated within 2-5 minutes of meeting creation</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>You can view your meetings and briefs on the dashboard</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Activating...
            </>
          ) : (
            'Activate Campaign'
          )}
        </button>
      </div>
    </div>
  )
}
