"use client";

import React from "react";
import { MeetingCard } from "./MeetingCard";
import type { ResearchStatus } from "../ui/StatusBadge";

export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  meetLink?: string | null;
  researchStatus: ResearchStatus;
  timezone: string;
}

export interface DailyViewProps {
  meetings: Meeting[];
  selectedDate: Date;
  timezone: string;
  className?: string;
}

export function DailyView({ meetings, selectedDate, timezone, className = "" }: DailyViewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone,
    });
  };

  // Filter meetings for the selected day
  const dailyMeetings = meetings.filter((meeting) => {
    const meetingDate = new Date(meeting.startTime);
    return (
      meetingDate.getFullYear() === selectedDate.getFullYear() &&
      meetingDate.getMonth() === selectedDate.getMonth() &&
      meetingDate.getDate() === selectedDate.getDate()
    );
  });

  // Sort by start time
  const sortedMeetings = [...dailyMeetings].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{formatDate(selectedDate)}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {sortedMeetings.length} {sortedMeetings.length === 1 ? "meeting" : "meetings"} scheduled
        </p>
      </div>

      {sortedMeetings.length > 0 ? (
        <div className="space-y-3">
          {sortedMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} {...meeting} timezone={timezone} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-lg font-medium">No meetings scheduled</p>
          <p className="text-sm mt-1">You have a free day!</p>
        </div>
      )}
    </div>
  );
}
