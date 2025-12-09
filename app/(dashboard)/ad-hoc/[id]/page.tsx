'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ResearchBriefPage,
  ResearchBriefPageProps,
} from '@/components/brief/ResearchBriefPage'
import { Button } from '@/components/ui/Button'
import { PDFDownloadButton } from '@/components/brief/PDFDownloadButton'
import { ErrorDisplay } from '@/components/brief/ErrorDisplay'

export default function AdHocBriefDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  const [briefData, setBriefData] = useState<ResearchBriefPageProps | null>(null)
  const [briefId, setBriefId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [researchFailed, setResearchFailed] = useState(false)
  const [failureReason, setFailureReason] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBrief() {
      try {
        setLoading(true)
        setError(null)

        // Fetch the ad-hoc research request
        const requestResponse = await fetch(`/api/adhoc/${requestId}`)
        if (!requestResponse.ok) {
          throw new Error('Failed to fetch ad-hoc research request')
        }
        const { request } = await requestResponse.json()

        // Check if research failed
        if (request.status === 'failed') {
          setResearchFailed(true)
          setFailureReason(request.failureReason || 'Research failed for unknown reason')
          setLoading(false)
          return
        }

        // Check if research is still generating
        if (request.status === 'generating' || request.status === 'pending') {
          // Poll every 5 seconds
          setTimeout(() => {
            fetchBrief()
          }, 5000)
          setLoading(false)
          return
        }

        if (!request.researchBriefId) {
          throw new Error('No research brief available yet')
        }

        // Fetch the research brief
        const briefResponse = await fetch(`/api/research/briefs/${request.researchBriefId}`)
        if (!briefResponse.ok) {
          throw new Error('Failed to fetch research brief')
        }
        const brief = await briefResponse.json()

        setBriefData(brief)
        setBriefId(request.researchBriefId)
      } catch (err) {
        console.error('Error fetching brief:', err)
        setError(err instanceof Error ? err.message : 'Failed to load research brief')
      } finally {
        setLoading(false)
      }
    }

    if (requestId) {
      fetchBrief()
    }
  }, [requestId])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this research request?')) {
      return
    }

    try {
      const response = await fetch(`/api/adhoc/${requestId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete research request')
      }

      // Redirect to ad-hoc list
      router.push('/ad-hoc')
    } catch (err) {
      console.error('Error deleting ad-hoc research request:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete research request')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading research brief...</p>
        </div>
      </div>
    )
  }

  // Handle failed research
  if (researchFailed) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/ad-hoc')}>
            ← Back to Ad-Hoc Research
          </Button>
        </div>
        <ErrorDisplay
          errorType="unknown"
          errorMessage={failureReason || 'Research failed for unknown reason'}
        />
        <div className="mt-6 flex gap-4">
          <Button variant="danger" onClick={handleDelete}>
            Delete Request
          </Button>
        </div>
      </div>
    )
  }

  // Handle generating state
  if (!briefData || !briefId) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/ad-hoc')}>
            ← Back to Ad-Hoc Research
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Generating Research Brief
          </h2>
          <p className="text-gray-600">
            This typically takes 2-5 minutes. The page will update automatically.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/ad-hoc')}>
            ← Back to Ad-Hoc Research
          </Button>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push('/ad-hoc')}>
          ← Back to Ad-Hoc Research
        </Button>
        <div className="flex gap-2">
          <PDFDownloadButton briefId={briefId} />
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
      <ResearchBriefPage {...briefData} />
    </div>
  )
}
