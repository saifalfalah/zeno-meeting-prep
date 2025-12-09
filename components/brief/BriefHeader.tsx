import React from "react";
import { Card } from "@/components/ui/Card";

export interface BriefHeaderProps {
  prospect: {
    name: string | null;
    title: string | null;
    location: string | null;
  };
  company: {
    name: string | null;
    industry: string | null;
    size: string | null;
  };
  meeting: {
    title: string;
    startTime: string;
    campaign: string;
    duration: string;
  };
}

export function BriefHeader({ prospect, company, meeting }: BriefHeaderProps) {
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Prospect Column */}
      <Card className="p-4" data-section="prospect">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Prospect
        </h3>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-sm font-medium text-gray-900">
              {prospect.name || "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Title</p>
            <p className="text-sm font-medium text-gray-900">
              {prospect.title || "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Location</p>
            <p className="text-sm font-medium text-gray-900">
              {prospect.location || "Unknown"}
            </p>
          </div>
        </div>
      </Card>

      {/* Company Column */}
      <Card className="p-4" data-section="company">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Company
        </h3>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-sm font-medium text-gray-900">
              {company.name || "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Industry</p>
            <p className="text-sm font-medium text-gray-900">
              {company.industry || "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Size</p>
            <p className="text-sm font-medium text-gray-900">
              {company.size || "Unknown"}
            </p>
          </div>
        </div>
      </Card>

      {/* Meeting Column */}
      <Card className="p-4" data-section="meeting">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Meeting
        </h3>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500">Title</p>
            <p className="text-sm font-medium text-gray-900">{meeting.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">When</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDateTime(meeting.startTime)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Campaign</p>
            <p className="text-sm font-medium text-gray-900">{meeting.campaign}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-medium text-gray-900">{meeting.duration}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
