'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '../ui/Card'
import { StatusBadge, ResearchStatus } from '../ui/StatusBadge'

export interface AdHocRequest {
  id: string
  prospectName?: string | null
  companyName?: string | null
  email?: string | null
  status: 'pending' | 'generating' | 'ready' | 'failed'
  createdAt: Date
  campaign: {
    id: string
    name: string
  }
  researchBriefId?: string | null
}

export interface AdHocListProps {
  requests: AdHocRequest[]
  onDelete?: (id: string) => void
  isDeleting?: string | null
}

export function AdHocList({ requests, onDelete, isDeleting = null }: AdHocListProps) {
  const getDisplayName = (request: AdHocRequest): string => {
    if (request.prospectName) return request.prospectName
    if (request.companyName) return request.companyName
    if (request.email) return request.email
    return 'Unknown'
  }

  const getSubtitle = (request: AdHocRequest): string => {
    const parts: string[] = []
    if (request.prospectName && request.companyName) {
      parts.push(request.companyName)
    }
    if (request.email && !parts.includes(request.email)) {
      parts.push(request.email)
    }
    return parts.join(' • ') || 'Ad-hoc research'
  }

  const mapStatusToResearchStatus = (status: AdHocRequest['status']): ResearchStatus => {
    switch (status) {
      case 'pending':
      case 'generating':
        return 'generating'
      case 'ready':
        return 'ready'
      case 'failed':
        return 'failed'
      default:
        return 'none'
    }
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No ad-hoc research yet</h3>
        <p className="text-gray-500 mb-6">
          Generate research briefs for prospects without calendar events
        </p>
        <Link
          href="/ad-hoc/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Research Brief
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const isClickable = request.status === 'ready' && request.researchBriefId

        return isClickable ? (
          <Link key={request.id} href={`/ad-hoc/${request.id}`} className="block">
            <Card
              className={`
                transition-all
                ${isClickable ? 'hover:shadow-md hover:border-gray-300 cursor-pointer' : ''}
              `}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {getDisplayName(request)}
                      </h3>
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        {getRelativeTime(request.createdAt)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-purple-100 text-purple-800">
                        {request.campaign.name}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="truncate">{getSubtitle(request)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={mapStatusToResearchStatus(request.status)} />
                    {onDelete && request.status !== 'generating' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDelete(request.id)
                        }}
                        disabled={isDeleting === request.id}
                        className={`
                          p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors
                          ${isDeleting === request.id ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <div key={request.id} className="block">
            <Card
              className={`
                transition-all
                ${isClickable ? 'hover:shadow-md hover:border-gray-300 cursor-pointer' : ''}
              `}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {getDisplayName(request)}
                      </h3>
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        {getRelativeTime(request.createdAt)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-purple-100 text-purple-800">
                        {request.campaign.name}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="truncate">{getSubtitle(request)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={mapStatusToResearchStatus(request.status)} />
                    {onDelete && request.status !== 'generating' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDelete(request.id)
                        }}
                        disabled={isDeleting === request.id}
                        className={`
                          p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors
                          ${isDeleting === request.id ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
