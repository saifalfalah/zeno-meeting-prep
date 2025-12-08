"use client";

import React from "react";
import { Button } from "../ui/Button";

export type CalendarView = "daily" | "weekly" | "monthly";

export interface CalendarNavigationProps {
  selectedDate: Date;
  currentView: CalendarView;
  onDateChange: (date: Date) => void;
  className?: string;
}

export function CalendarNavigation({
  selectedDate,
  currentView,
  onDateChange,
  className = "",
}: CalendarNavigationProps) {
  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    switch (currentView) {
      case "daily":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "weekly":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "monthly":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    switch (currentView) {
      case "daily":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "weekly":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "monthly":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const formatDateRange = () => {
    switch (currentView) {
      case "daily":
        return selectedDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      case "weekly": {
        const weekStart = new Date(selectedDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      }
      case "monthly":
        return selectedDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        <Button onClick={handleToday} variant="outline" size="sm">
          Today
        </Button>
        <div className="flex items-center gap-1">
          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="sm"
            aria-label="Previous"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Button>
          <Button
            onClick={handleNext}
            variant="ghost"
            size="sm"
            aria-label="Next"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>
      </div>

      <h1 className="text-xl font-semibold text-gray-900">{formatDateRange()}</h1>

      <div className="w-20" /> {/* Spacer for layout balance */}
    </div>
  );
}
