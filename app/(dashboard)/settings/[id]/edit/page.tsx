'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Disable static generation for authenticated pages
export const dynamic = 'force-dynamic'

interface Campaign {
  id: string
  name: string
  status: 'active' | 'paused'
  companyName: string
  companyDomain: string
  companyDescription: string
  offeringTitle: string
  offeringDescription: string
  targetCustomer: string
  keyPainPoints: string[]
  googleCalendarName: string
  googleCalendarId: string
}

export default function EditCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'active' | 'paused'>('active')
  const [companyDescription, setCompanyDescription] = useState('')
  const [offeringTitle, setOfferingTitle] = useState('')
  const [offeringDescription, setOfferingDescription] = useState('')
  const [targetCustomer, setTargetCustomer] = useState('')
  const [painPoints, setPainPoints] = useState<string[]>([''])

  useEffect(() => {
    fetchCampaign()
  }, [campaignId])

  const fetchCampaign = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch campaign')
      }

      const data = await response.json()
      const camp = data.campaign

      setCampaign(camp)
      setName(camp.name)
      setStatus(camp.status)
      setCompanyDescription(camp.companyDescription || '')
      setOfferingTitle(camp.offeringTitle)
      setOfferingDescription(camp.offeringDescription)
      setTargetCustomer(camp.targetCustomer || '')
      setPainPoints(camp.keyPainPoints.length > 0 ? camp.keyPainPoints : [''])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    // Optimistic update: immediately update local state
    const previousCampaign = campaign
    const validPainPoints = painPoints.filter((p) => p.trim().length > 0)
    setCampaign({
      ...campaign!,
      name,
      status,
      companyDescription,
      offeringTitle,
      offeringDescription,
      targetCustomer,
      keyPainPoints: validPainPoints,
    })

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          status,
          companyDescription,
          offeringTitle,
          offeringDescription,
          targetCustomer,
          keyPainPoints: validPainPoints,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update campaign')
      }

      router.push('/settings')
    } catch (err) {
      // Rollback on error
      setCampaign(previousCampaign)
      setError(err instanceof Error ? err.message : 'Failed to save campaign')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete campaign')
      }

      router.push('/settings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign not found</h2>
          <button
            onClick={() => router.push('/settings')}
            className="text-blue-600 hover:underline"
          >
            Return to settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
          <p className="mt-2 text-gray-600">Update your campaign settings</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Campaign Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'paused')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Pausing will stop webhook monitoring temporarily
            </p>
          </div>

          {/* Calendar (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calendar</label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="font-medium">{campaign.googleCalendarName}</p>
              <p className="text-sm text-gray-600">Calendar cannot be changed after creation</p>
            </div>
          </div>

          {/* Company (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="font-medium">
                {campaign.companyName} ({campaign.companyDomain})
              </p>
              <p className="text-sm text-gray-600">Company info cannot be changed after creation</p>
            </div>
          </div>

          {/* Company Description */}
          <div>
            <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Company Description
            </label>
            <textarea
              id="companyDescription"
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Offering Title */}
          <div>
            <label htmlFor="offeringTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Offering Title
            </label>
            <input
              id="offeringTitle"
              type="text"
              value={offeringTitle}
              onChange={(e) => setOfferingTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Offering Description */}
          <div>
            <label htmlFor="offeringDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Offering Description
            </label>
            <textarea
              id="offeringDescription"
              value={offeringDescription}
              onChange={(e) => setOfferingDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Target Customer */}
          <div>
            <label htmlFor="targetCustomer" className="block text-sm font-medium text-gray-700 mb-1">
              Target Customer
            </label>
            <textarea
              id="targetCustomer"
              value={targetCustomer}
              onChange={(e) => setTargetCustomer(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Pain Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pain Points</label>
            {painPoints.map((point, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => {
                    const newPoints = [...painPoints]
                    newPoints[index] = e.target.value
                    setPainPoints(newPoints)
                  }}
                  placeholder={`Pain point ${index + 1}`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {painPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newPoints = painPoints.filter((_, i) => i !== index)
                      setPainPoints(newPoints.length === 0 ? [''] : newPoints)
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPainPoints([...painPoints, ''])}
              className="mt-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
            >
              + Add Pain Point
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              Delete Campaign
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/settings')}
                disabled={isSaving}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Campaign?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this campaign? Historical research briefs will be preserved, but webhook monitoring will stop.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
