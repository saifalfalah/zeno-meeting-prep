'use client'

import { useState } from 'react'
import { CampaignFormData } from './SetupWizard'

export interface CompanyFormProps {
  initialData: Partial<CampaignFormData>
  onNext: (data: Partial<CampaignFormData>) => void
  onBack: () => void
}

export function CompanyForm({ initialData, onNext, onBack }: CompanyFormProps) {
  const [companyName, setCompanyName] = useState(initialData.companyName || '')
  const [companyDomain, setCompanyDomain] = useState(initialData.companyDomain || '')
  const [companyDescription, setCompanyDescription] = useState(initialData.companyDescription || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateDomain = (domain: string): boolean => {
    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    return domainRegex.test(domain)
  }

  const handleNext = () => {
    const newErrors: Record<string, string> = {}

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }

    if (!companyDomain.trim()) {
      newErrors.companyDomain = 'Company domain is required'
    } else if (!validateDomain(companyDomain.trim())) {
      newErrors.companyDomain = 'Please enter a valid domain (e.g., example.com)'
    }

    if (!companyDescription.trim()) {
      newErrors.companyDescription = 'Company description is required'
    } else if (companyDescription.trim().length < 20) {
      newErrors.companyDescription = 'Please provide at least 20 characters'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onNext({
        companyName: companyName.trim(),
        companyDomain: companyDomain.trim().toLowerCase(),
        companyDescription: companyDescription.trim(),
      })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Your Company</h2>
      <p className="text-gray-600 mb-6">
        Tell us about your company so we can identify external attendees and provide context in research briefs.
      </p>

      <div className="space-y-6">
        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value)
              if (errors.companyName) {
                setErrors({ ...errors, companyName: '' })
              }
            }}
            placeholder="Acme Corp"
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.companyName ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
          )}
        </div>

        {/* Company Domain */}
        <div>
          <label htmlFor="companyDomain" className="block text-sm font-medium text-gray-700 mb-1">
            Company Domain *
          </label>
          <input
            id="companyDomain"
            type="text"
            value={companyDomain}
            onChange={(e) => {
              setCompanyDomain(e.target.value)
              if (errors.companyDomain) {
                setErrors({ ...errors, companyDomain: '' })
              }
            }}
            placeholder="acmecorp.com"
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.companyDomain ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          <p className="mt-1 text-sm text-gray-500">
            Used to identify internal vs. external meeting attendees
          </p>
          {errors.companyDomain && (
            <p className="mt-1 text-sm text-red-600">{errors.companyDomain}</p>
          )}
        </div>

        {/* Company Description */}
        <div>
          <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Company Description *
          </label>
          <textarea
            id="companyDescription"
            value={companyDescription}
            onChange={(e) => {
              setCompanyDescription(e.target.value)
              if (errors.companyDescription) {
                setErrors({ ...errors, companyDescription: '' })
              }
            }}
            placeholder="A brief 2-3 sentence description of what your company does..."
            rows={4}
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.companyDescription ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          <p className="mt-1 text-sm text-gray-500">
            {companyDescription.length} characters (minimum 20)
          </p>
          {errors.companyDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.companyDescription}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  )
}
