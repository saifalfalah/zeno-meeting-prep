'use client'

import { useState } from 'react'
import { CalendarSelector } from './CalendarSelector'
import { CompanyForm } from './CompanyForm'
import { OfferingForm } from './OfferingForm'
import { ReviewActivate } from './ReviewActivate'

export interface CampaignFormData {
  // Step 1: Calendar Selection
  googleCalendarId: string
  googleCalendarName: string

  // Step 2: Company Info
  companyName: string
  companyDomain: string
  companyDescription: string

  // Step 3: Offering Info
  offeringTitle: string
  offeringDescription: string
  targetCustomer: string
  keyPainPoints: string[]
}

export interface SetupWizardProps {
  onComplete: (data: CampaignFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<CampaignFormData>
}

export function SetupWizard({ onComplete, onCancel, initialData }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<CampaignFormData>>(initialData || {})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 4

  const handleNext = (stepData: Partial<CampaignFormData>) => {
    setFormData({ ...formData, ...stepData })
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (stepData: Partial<CampaignFormData>) => {
    setIsSubmitting(true)
    try {
      const finalData = { ...formData, ...stepData } as CampaignFormData
      await onComplete(finalData)
    } catch (error) {
      console.error('Failed to create campaign:', error)
      // Keep isSubmitting true to prevent multiple submissions
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const step = index + 1
            const isActive = step === currentStep
            const isCompleted = step < currentStep

            return (
              <div
                key={step}
                className="flex items-center flex-1"
              >
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-semibold
                    ${isActive ? 'bg-blue-600 text-white' : ''}
                    ${isCompleted ? 'bg-green-600 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600' : ''}
                  `}
                >
                  {isCompleted ? '✓' : step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`
                      flex-1 h-1 mx-2
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Calendar</span>
          <span>Company</span>
          <span>Offering</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {currentStep === 1 && (
          <CalendarSelector
            initialData={formData}
            onNext={handleNext}
            onCancel={onCancel}
          />
        )}
        {currentStep === 2 && (
          <CompanyForm
            initialData={formData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <OfferingForm
            initialData={formData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 4 && (
          <ReviewActivate
            data={formData as CampaignFormData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}
