'use client';

import { AlertTriangle, RefreshCw, Info } from 'lucide-react';

type ErrorType =
  | 'prospect_lookup_failed'
  | 'company_lookup_failed'
  | 'brief_generation_failed'
  | 'rate_limit_exceeded'
  | 'api_timeout'
  | 'partial_data'
  | 'unknown';

type ConfidenceRating = 'HIGH' | 'MEDIUM' | 'LOW';

interface ErrorDisplayProps {
  errorType: ErrorType;
  errorMessage: string;
  onRetry?: () => void;
  confidenceRating?: ConfidenceRating;
  timestamp?: Date;
}

/**
 * Display component for research errors with clear messaging and retry option
 * Implements US5: Handle Research Errors Transparently
 */
export function ErrorDisplay({
  errorType,
  errorMessage,
  onRetry,
  confidenceRating,
  timestamp,
}: ErrorDisplayProps) {
  // Determine heading based on error type
  const getHeading = (): string => {
    if (errorType === 'partial_data' && confidenceRating === 'LOW') {
      return 'Partial Information';
    }

    switch (errorType) {
      case 'prospect_lookup_failed':
        return 'Prospect Research Failed';
      case 'company_lookup_failed':
        return 'Company Research Failed';
      case 'brief_generation_failed':
        return 'Brief Generation Failed';
      case 'rate_limit_exceeded':
        return 'Rate Limit Exceeded';
      case 'api_timeout':
        return 'Request Timed Out';
      case 'partial_data':
        return 'Partial Information';
      default:
        return 'Research Failed';
    }
  };

  // Provide helpful suggestions based on error type
  const getSuggestion = (): string | null => {
    switch (errorType) {
      case 'rate_limit_exceeded':
        return 'Please try again in a few minutes. Our research APIs have usage limits.';
      case 'api_timeout':
        return 'The research request took too long. Try again or check your network connection.';
      case 'prospect_lookup_failed':
        return 'We could not find enough information about this prospect. The email may be private or inactive.';
      case 'company_lookup_failed':
        return 'Unable to gather company information. The company may be very new, private, or have limited online presence.';
      case 'brief_generation_failed':
        return 'Failed to synthesize research into a brief. This may be a temporary issue with our AI service.';
      case 'partial_data':
        return 'Some research data is missing or incomplete. The brief below shows what we could gather.';
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  };

  const isPartialData = errorType === 'partial_data';
  const IconComponent = isPartialData ? Info : AlertTriangle;
  const bgColor = isPartialData ? 'bg-yellow-50' : 'bg-red-50';
  const borderColor = isPartialData ? 'border-yellow-200' : 'border-red-200';
  const textColor = isPartialData ? 'text-yellow-800' : 'text-red-800';
  const iconColor = isPartialData ? 'text-yellow-600' : 'text-red-600';

  return (
    <div
      className={`rounded-lg border-2 ${borderColor} ${bgColor} p-6 ${textColor}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4">
        <IconComponent
          className={`h-6 w-6 ${iconColor} flex-shrink-0 mt-0.5`}
          aria-hidden="true"
        />

        <div className="flex-1 space-y-3">
          {/* Heading */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {getHeading()}
            </h3>

            {confidenceRating && (
              <span
                role="status"
                aria-label={confidenceRating}
                className={`
                  inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
                  ${confidenceRating === 'LOW' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${confidenceRating === 'MEDIUM' ? 'bg-orange-100 text-orange-800' : ''}
                  ${confidenceRating === 'HIGH' ? 'bg-green-100 text-green-800' : ''}
                `}
              >
                {confidenceRating}
              </span>
            )}
          </div>

          {/* Error message */}
          <p className="text-sm leading-relaxed">
            {errorMessage}
          </p>

          {/* Helpful suggestion */}
          {getSuggestion() && (
            <p className="text-sm leading-relaxed opacity-90">
              {getSuggestion()}
            </p>
          )}

          {/* Timestamp */}
          {timestamp && (
            <p className="text-xs opacity-70">
              Failed at {timestamp.toLocaleTimeString()} on {timestamp.toLocaleDateString()}
            </p>
          )}

          {/* Retry button */}
          {onRetry && (
            <div className="pt-2">
              <button
                onClick={onRetry}
                className={`
                  inline-flex items-center gap-2 rounded-md px-4 py-2
                  text-sm font-medium text-white
                  ${isPartialData ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isPartialData ? 'focus:ring-yellow-500' : 'focus:ring-red-500'}
                  transition-colors duration-200
                `}
                aria-label="Retry research"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry Research
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
