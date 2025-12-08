"use client";

import React from "react";

export type CalendarView = "daily" | "weekly" | "monthly";

export interface ViewToggleProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  className?: string;
}

export function ViewToggle({ currentView, onViewChange, className = "" }: ViewToggleProps) {
  const views: Array<{ value: CalendarView; label: string }> = [
    { value: "daily", label: "Day" },
    { value: "weekly", label: "Week" },
    { value: "monthly", label: "Month" },
  ];

  return (
    <div className={`inline-flex rounded-lg border border-gray-200 bg-white p-1 ${className}`}>
      {views.map((view) => (
        <button
          key={view.value}
          onClick={() => onViewChange(view.value)}
          className={`
            rounded-md px-4 py-2 text-sm font-medium transition-colors
            ${
              currentView === view.value
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }
          `}
          aria-pressed={currentView === view.value}
          aria-label={`Switch to ${view.label} view`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
