"use client";

import React from "react";
import { MeetingCard } from "./MeetingCard";
import type { Meeting } from "./DailyView";

export interface WeeklyViewProps {
  meetings: Meeting[];
  selectedDate: Date;
  timezone: string;
  className?: string;
}

export function WeeklyView({ meetings, selectedDate, timezone, className = "" }: WeeklyViewProps) {
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday = 0
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (startDate: Date) => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekStart = getWeekStart(selectedDate);
  const weekDays = getWeekDays(weekStart);

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.startTime);
      return (
        meetingDate.getFullYear() === day.getFullYear() &&
        meetingDate.getMonth() === day.getMonth() &&
        meetingDate.getDate() === day.getDate()
      );
    }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  const formatDayHeader = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: timezone,
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {weekStart.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            timeZone: timezone,
          })}{" "}
          -{" "}
          {weekDays[6].toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: timezone,
          })}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayMeetings = getMeetingsForDay(day);
          return (
            <div
              key={index}
              className={`
                border rounded-lg p-3 min-h-[200px]
                ${isToday(day) ? "border-blue-500 bg-blue-50" : "border-gray-200"}
              `}
            >
              <div className="mb-3">
                <div
                  className={`
                  text-sm font-semibold
                  ${isToday(day) ? "text-blue-900" : "text-gray-700"}
                `}
                >
                  {formatDayHeader(day)}
                </div>
                {dayMeetings.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {dayMeetings.length} {dayMeetings.length === 1 ? "meeting" : "meetings"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {dayMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} {...meeting} timezone={timezone} className="text-xs" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
