'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { type CampaignFormData } from '@/components/campaign/SetupWizard'
import { useState } from 'react'

// Dynamically import the SetupWizard to avoid SSR issues
const SetupWizard = dynamic(
  () => import('@/components/campaign/SetupWizard').then((mod) => ({ default: mod.SetupWizard })),
  { ssr: false, loading: () => <div className="text-center py-12">Loading wizard...</div> }
)

export default function NewCampaignPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async (data: CampaignFormData) => {
    setError(null)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create campaign')
      }

      await response.json()

      // Redirect to settings page on success
      router.push('/settings')
    } catch (err) {
      console.error('Campaign creation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
      throw err // Re-throw to keep SetupWizard in submitting state
    }
  }

  const handleCancel = () => {
    router.push('/settings')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="mt-2 text-gray-600">
            Set up a new campaign to start automatically researching your sales meetings
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error creating campaign:</p>
            <p>{error}</p>
          </div>
        )}

        <SetupWizard onComplete={handleComplete} onCancel={handleCancel} />
      </div>
    </div>
  )
}
