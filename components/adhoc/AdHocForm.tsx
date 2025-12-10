'use client'

import { useState } from 'react'

export interface AdHocFormData {
  prospectName?: string
  companyName?: string
  email?: string
  website?: string
  campaignId: string
}

export interface AdHocFormProps {
  campaigns: Array<{ id: string; name: string }>
  onSubmit: (data: AdHocFormData) => Promise<void>
  isSubmitting?: boolean
}

export function AdHocForm({ campaigns, onSubmit, isSubmitting = false }: AdHocFormProps) {
  const [prospectName, setProspectName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    // At least one field must be provided
    if (!prospectName.trim() && !companyName.trim() && !email.trim()) {
      newErrors.form = 'Please provide at least one field: Prospect Name, Company Name, or Email'
    }

    // Validate email format if provided
    if (email.trim() && !validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Campaign must be selected
    if (!campaignId) {
      newErrors.campaignId = 'Please select a campaign'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      await onSubmit({
        prospectName: prospectName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        email: email.trim() || undefined,
        campaignId,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">New Ad-Hoc Research</h2>
        <p className="text-gray-600 mb-6">
          Generate a research brief without a calendar event. Provide at least one piece of information below.
        </p>
      </div>

      {/* Form-level error */}
      {errors.form && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.form}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Campaign Selector */}
        <div>
          <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-1">
            Campaign *
          </label>
          <select
            id="campaignId"
            value={campaignId}
            onChange={(e) => {
              setCampaignId(e.target.value)
              if (errors.campaignId) {
                setErrors({ ...errors, campaignId: '' })
              }
            }}
            disabled={isSubmitting}
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.campaignId ? 'border-red-500' : 'border-gray-300'}
              ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}
            `}
          >
            <option value="">Select a campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Research brief will use this campaign&apos;s context
          </p>
          {errors.campaignId && (
            <p className="mt-1 text-sm text-red-600">{errors.campaignId}</p>
          )}
        </div>

        {/* Prospect Name */}
        <div>
          <label htmlFor="prospectName" className="block text-sm font-medium text-gray-700 mb-1">
            Prospect Name
          </label>
          <input
            id="prospectName"
            type="text"
            value={prospectName}
            onChange={(e) => {
              setProspectName(e.target.value)
              if (errors.form) {
                setErrors({ ...errors, form: '' })
              }
            }}
            disabled={isSubmitting}
            placeholder="John Doe"
            className={`
              w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}
            `}
          />
          <p className="mt-1 text-sm text-gray-500">Optional - will help personalize research</p>
        </div>

        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value)
              if (errors.form) {
                setErrors({ ...errors, form: '' })
              }
            }}
            disabled={isSubmitting}
            placeholder="Acme Corp"
            className={`
              w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}
            `}
          />
          <p className="mt-1 text-sm text-gray-500">Optional - will be used for company research</p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email || errors.form) {
                setErrors({ ...errors, email: '', form: '' })
              }
            }}
            disabled={isSubmitting}
            placeholder="john.doe@acmecorp.com"
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.email ? 'border-red-500' : 'border-gray-300'}
              ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}
            `}
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional - company will be inferred from domain if not provided
          </p>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isSubmitting ? 'Generating...' : 'Generate Research Brief'}
        </button>
      </div>
    </form>
  )
}
