import React from "react";
import { Card } from "@/components/ui/Card";

export interface QuickFactsProps {
  companyAtAGlance: {
    name: string | null;
    industry: string | null;
    employeeCount: string | null;
    fundingStage: string | null;
    headquarters: string | null;
  };
  prospectAtAGlance: {
    name: string | null;
    title: string | null;
    reportsTo: string | null;
    teamSize: string | null;
    background: string | null;
  };
  recentSignals: Array<{
    type: 'positive' | 'neutral' | 'negative';
    text: string;
  }>;
}

export function QuickFacts({
  companyAtAGlance,
  prospectAtAGlance,
  recentSignals,
}: QuickFactsProps) {
  const signalTypeColors = {
    positive: 'text-green-700 bg-green-50',
    neutral: 'text-blue-700 bg-blue-50',
    negative: 'text-red-700 bg-red-50',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Company at a Glance */}
      <Card className="p-4" data-box="company">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Company at a Glance
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name:</span>
            <span className="font-medium text-gray-900">
              {companyAtAGlance.name || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Industry:</span>
            <span className="font-medium text-gray-900">
              {companyAtAGlance.industry || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Employees:</span>
            <span className="font-medium text-gray-900">
              {companyAtAGlance.employeeCount || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Funding:</span>
            <span className="font-medium text-gray-900">
              {companyAtAGlance.fundingStage || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">HQ:</span>
            <span className="font-medium text-gray-900">
              {companyAtAGlance.headquarters || "Unknown"}
            </span>
          </div>
        </div>
      </Card>

      {/* Prospect at a Glance */}
      <Card className="p-4" data-box="prospect">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Prospect at a Glance
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name:</span>
            <span className="font-medium text-gray-900">
              {prospectAtAGlance.name || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Title:</span>
            <span className="font-medium text-gray-900">
              {prospectAtAGlance.title || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reports To:</span>
            <span className="font-medium text-gray-900">
              {prospectAtAGlance.reportsTo || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Team Size:</span>
            <span className="font-medium text-gray-900">
              {prospectAtAGlance.teamSize || "Unknown"}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Background:</span>
            <p className="font-medium text-gray-900 mt-1">
              {prospectAtAGlance.background || "Unknown"}
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Signals */}
      <Card className="p-4" data-box="signals">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Recent Signals
          <span className="text-xs text-gray-500 font-normal ml-2">(Last 90 days)</span>
        </h3>
        <div className="space-y-2">
          {recentSignals.length === 0 ? (
            <p className="text-sm text-gray-500">No recent signals</p>
          ) : (
            recentSignals.map((signal, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${signalTypeColors[signal.type]}`}
                data-signal-type={signal.type}
              >
                {signal.text}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
