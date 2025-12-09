import React from "react";
import { Card } from "@/components/ui/Card";

export interface CallStrategyProps {
  openingLine: string | null;
  discoveryQuestions: string[];
  successOutcome: string | null;
  watchOuts: string | null;
}

export function CallStrategy({
  openingLine,
  discoveryQuestions,
  successOutcome,
  watchOuts,
}: CallStrategyProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Opening Line */}
      <Card className="p-4" data-box="opening-line">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Opening Line
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {openingLine || "Unknown"}
        </p>
      </Card>

      {/* Discovery Questions */}
      <Card className="p-4" data-box="discovery-questions">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Discovery Questions
        </h3>
        {discoveryQuestions.length === 0 ? (
          <p className="text-sm text-gray-500">Unknown</p>
        ) : (
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            {discoveryQuestions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        )}
      </Card>

      {/* Success Outcome */}
      <Card className="p-4" data-box="success-outcome">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Success Outcome
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {successOutcome || "Unknown"}
        </p>
      </Card>

      {/* Watch Out For */}
      <Card className="p-4" data-box="watch-outs">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Watch Out For
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {watchOuts || "Unknown"}
        </p>
      </Card>
    </div>
  );
}
