'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdHocList, type AdHocRequest } from '@/components/adhoc/AdHocList'

export default function AdHocResearchPage() {
  const [requests, setRequests] = useState<AdHocRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/adhoc')

      if (!response.ok) {
        throw new Error('Failed to fetch ad-hoc research requests')
      }

      const data = await response.json()
      setRequests(
        data.requests.map((req: AdHocRequest) => ({
          ...req,
          createdAt: new Date(req.createdAt),
        }))
      )
    } catch (err) {
      console.error('Error fetching ad-hoc research requests:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this research request?')) {
      return
    }

    try {
      setDeletingId(id)

      const response = await fetch(`/api/adhoc/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete research request')
      }

      // Remove from list
      setRequests((prev) => prev.filter((req) => req.id !== id))
    } catch (err) {
      console.error('Error deleting ad-hoc research request:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete research request')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ad-Hoc Research</h1>
          <p className="mt-2 text-gray-600">
            Generate research briefs without calendar events
          </p>
        </div>
        <Link
          href="/ad-hoc/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Research
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <AdHocList requests={requests} onDelete={handleDelete} isDeleting={deletingId} />
      )}
    </div>
  )
}
