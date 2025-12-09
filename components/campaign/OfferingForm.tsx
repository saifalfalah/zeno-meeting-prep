'use client'

import { useState } from 'react'
import { CampaignFormData } from './SetupWizard'

export interface OfferingFormProps {
  initialData: Partial<CampaignFormData>
  onNext: (data: Partial<CampaignFormData>) => void
  onBack: () => void
}

export function OfferingForm({ initialData, onNext, onBack }: OfferingFormProps) {
  const [offeringTitle, setOfferingTitle] = useState(initialData.offeringTitle || '')
  const [offeringDescription, setOfferingDescription] = useState(initialData.offeringDescription || '')
  const [targetCustomer, setTargetCustomer] = useState(initialData.targetCustomer || '')
  const [painPoints, setPainPoints] = useState<string[]>(initialData.keyPainPoints || [''])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAddPainPoint = () => {
    setPainPoints([...painPoints, ''])
  }

  const handleRemovePainPoint = (index: number) => {
    const newPainPoints = painPoints.filter((_, i) => i !== index)
    setPainPoints(newPainPoints.length === 0 ? [''] : newPainPoints)
  }

  const handlePainPointChange = (index: number, value: string) => {
    const newPainPoints = [...painPoints]
    newPainPoints[index] = value
    setPainPoints(newPainPoints)
  }

  const handleNext = () => {
    const newErrors: Record<string, string> = {}

    if (!offeringTitle.trim()) {
      newErrors.offeringTitle = 'Offering title is required'
    }

    if (!offeringDescription.trim()) {
      newErrors.offeringDescription = 'Offering description is required'
    } else if (offeringDescription.trim().length < 20) {
      newErrors.offeringDescription = 'Please provide at least 20 characters'
    }

    if (!targetCustomer.trim()) {
      newErrors.targetCustomer = 'Target customer description is required'
    }

    const validPainPoints = painPoints.filter(p => p.trim().length > 0)
    if (validPainPoints.length === 0) {
      newErrors.painPoints = 'At least one pain point is required'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onNext({
        offeringTitle: offeringTitle.trim(),
        offeringDescription: offeringDescription.trim(),
        targetCustomer: targetCustomer.trim(),
        keyPainPoints: validPainPoints,
      })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Your Offering</h2>
      <p className="text-gray-600 mb-6">
        Describe what you're selling so we can tailor research briefs to show how prospects align with your solution.
      </p>

      <div className="space-y-6">
        {/* Offering Title */}
        <div>
          <label htmlFor="offeringTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Offering Title *
          </label>
          <input
            id="offeringTitle"
            type="text"
            value={offeringTitle}
            onChange={(e) => {
              setOfferingTitle(e.target.value)
              if (errors.offeringTitle) {
                setErrors({ ...errors, offeringTitle: '' })
              }
            }}
            placeholder="AI-Powered Sales Intelligence Platform"
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.offeringTitle ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          {errors.offeringTitle && (
            <p className="mt-1 text-sm text-red-600">{errors.offeringTitle}</p>
          )}
        </div>

        {/* Offering Description */}
        <div>
          <label htmlFor="offeringDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Offering Description *
          </label>
          <textarea
            id="offeringDescription"
            value={offeringDescription}
            onChange={(e) => {
              setOfferingDescription(e.target.value)
              if (errors.offeringDescription) {
                setErrors({ ...errors, offeringDescription: '' })
              }
            }}
            placeholder="Describe what your product/service does and its key benefits..."
            rows={4}
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.offeringDescription ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          <p className="mt-1 text-sm text-gray-500">
            {offeringDescription.length} characters (minimum 20)
          </p>
          {errors.offeringDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.offeringDescription}</p>
          )}
        </div>

        {/* Target Customer */}
        <div>
          <label htmlFor="targetCustomer" className="block text-sm font-medium text-gray-700 mb-1">
            Target Customer *
          </label>
          <textarea
            id="targetCustomer"
            value={targetCustomer}
            onChange={(e) => {
              setTargetCustomer(e.target.value)
              if (errors.targetCustomer) {
                setErrors({ ...errors, targetCustomer: '' })
              }
            }}
            placeholder="e.g., B2B SaaS companies with 50-500 employees looking to improve sales efficiency..."
            rows={3}
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.targetCustomer ? 'border-red-500' : 'border-gray-300'}
            `}
          />
          {errors.targetCustomer && (
            <p className="mt-1 text-sm text-red-600">{errors.targetCustomer}</p>
          )}
        </div>

        {/* Key Pain Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Key Pain Points *
          </label>
          <p className="text-sm text-gray-500 mb-3">
            What problems does your offering solve? Add at least one.
          </p>

          {painPoints.map((painPoint, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={painPoint}
                onChange={(e) => handlePainPointChange(index, e.target.value)}
                placeholder={`Pain point ${index + 1}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {painPoints.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePainPoint(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddPainPoint}
            className="mt-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
          >
            + Add Pain Point
          </button>

          {errors.painPoints && (
            <p className="mt-1 text-sm text-red-600">{errors.painPoints}</p>
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
