"use client";

import React from "react";
import Link from "next/link";
import type { Meeting } from "./DailyView";
import { StatusBadge } from "../ui/StatusBadge";

export interface MonthlyViewProps {
  meetings: Meeting[];
  selectedDate: Date;
  timezone: string;
  className?: string;
}

export function MonthlyView({ meetings, selectedDate, timezone, className = "" }: MonthlyViewProps) {
  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthDays = (date: Date) => {
    const firstDay = getMonthStart(date);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    return days;
  };

  const monthDays = getMonthDays(selectedDate);

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

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: timezone,
    });
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{formatMonthYear(selectedDate)}</h2>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {monthDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="bg-white min-h-[120px]" />;
          }

          const dayMeetings = getMeetingsForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={index}
              className={`
                bg-white min-h-[120px] p-2 relative
                ${isCurrentDay ? "ring-2 ring-blue-500 ring-inset" : ""}
              `}
            >
              <div
                className={`
                  text-sm font-semibold mb-2
                  ${isCurrentDay ? "text-blue-600" : "text-gray-900"}
                `}
              >
                {day.getDate()}
              </div>

              <div className="space-y-1">
                {dayMeetings.slice(0, 3).map((meeting) => {
                  const startTime = meeting.startTime.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: timezone,
                  });

                  return (
                    <Link
                      key={meeting.id}
                      href={`/meetings/${meeting.id}`}
                      className="block"
                    >
                      <div className="bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 text-xs transition-colors">
                        <div className="font-medium text-gray-900 truncate">{meeting.title}</div>
                        <div className="text-gray-600 flex items-center justify-between gap-1 mt-0.5">
                          <span>{startTime}</span>
                          <StatusBadge status={meeting.researchStatus} className="scale-75 origin-right" />
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {dayMeetings.length > 3 && (
                  <div className="text-xs text-gray-500 px-2 py-1">
                    +{dayMeetings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
