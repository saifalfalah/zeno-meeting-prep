"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "../ui/Card";
import { StatusBadge, ResearchStatus } from "../ui/StatusBadge";

export interface MeetingCardProps {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  meetLink?: string | null;
  researchStatus: ResearchStatus;
  timezone: string;
  campaign?: {
    id: string;
    name: string;
    status: 'active' | 'paused';
  } | null;
  className?: string;
}

export function MeetingCard({
  id,
  title,
  startTime,
  endTime,
  location,
  meetLink,
  researchStatus,
  timezone,
  campaign,
  className = "",
}: MeetingCardProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    });
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 0) return "Past";
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `in ${diffDays} days`;
    return null;
  };

  const relativeTime = getRelativeTime(startTime);

  return (
    <Link href={`/meetings/${id}`} className="block">
      <Card
        className={`
          transition-all hover:shadow-md hover:border-gray-300 cursor-pointer
          ${className}
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
                {relativeTime && (
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    {relativeTime}
                  </span>
                )}
                {campaign && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      campaign.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    title={campaign.status === 'paused' ? 'Campaign is paused' : undefined}
                  >
                    {campaign.name}
                  </span>
                )}
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {formatTime(startTime)} - {formatTime(endTime)}
                  </span>
                </div>

                {(location || meetLink) && (
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="truncate">{meetLink ? "Video call" : location}</span>
                  </div>
                )}
              </div>
            </div>

            <StatusBadge status={researchStatus} className="flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
