import React from "react";
import { Card } from "@/components/ui/Card";

export type ConfidenceRating = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BriefFooterProps {
  confidenceRating: ConfidenceRating;
  confidenceExplanation: string | null;
  sources: Array<{
    type: string;
    url: string;
    title: string;
  }>;
}

export function BriefFooter({
  confidenceRating,
  confidenceExplanation,
  sources,
}: BriefFooterProps) {
  const confidenceColors = {
    HIGH: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-4">
      {/* Confidence Section */}
      <Card className="p-6" data-section="confidence">
        <div className="flex items-start gap-3">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${confidenceColors[confidenceRating]}`}
            data-confidence={confidenceRating}
          >
            Confidence: {confidenceRating}
          </div>
          <p className="text-sm text-gray-700 flex-1">
            {confidenceExplanation || "No explanation provided"}
          </p>
        </div>
      </Card>

      {/* Sources Section */}
      <Card className="p-6" data-section="sources">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Sources</h3>
        {sources.length === 0 ? (
          <p className="text-sm text-gray-500">No sources available</p>
        ) : (
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {source.title}
                </a>
                <span className="text-gray-500 ml-2">({source.type})</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
