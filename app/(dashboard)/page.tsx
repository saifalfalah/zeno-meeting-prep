"use client";

import React, { useState, useEffect } from "react";
import { DailyView } from "@/components/calendar/DailyView";
import { WeeklyView } from "@/components/calendar/WeeklyView";
import { MonthlyView } from "@/components/calendar/MonthlyView";
import { ViewToggle, CalendarView } from "@/components/calendar/ViewToggle";
import { CalendarNavigation } from "@/components/calendar/CalendarNavigation";
import { CampaignFilter, Campaign } from "@/components/calendar/CampaignFilter";
import type { Meeting } from "@/components/calendar/DailyView";

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<CalendarView>("weekly");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("America/Los_Angeles");

  // Detect user's timezone
  useEffect(() => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(detectedTimezone);
    } catch (error) {
      console.error("Error detecting timezone:", error);
      // Fallback to default timezone
    }
  }, []);

  // Fetch campaigns on mount
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch("/api/campaigns");
        if (!response.ok) {
          throw new Error("Failed to fetch campaigns");
        }
        const data = await response.json();
        setCampaigns(data.campaigns || []);

        // Auto-select first campaign if available
        if (data.campaigns && data.campaigns.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(data.campaigns[0].id);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        setError("Failed to load campaigns");
      }
    }

    fetchCampaigns();
  }, [selectedCampaignId]);

  // Fetch meetings when campaign or date changes
  useEffect(() => {
    async function fetchMeetings() {
      if (!selectedCampaignId) {
        setMeetings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Calculate date range based on current view
        let startDate: Date;
        let endDate: Date;

        switch (currentView) {
          case "daily":
            startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
            break;
          case "weekly": {
            const weekStart = new Date(selectedDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            startDate = weekStart;
            endDate = weekEnd;
            break;
          }
          case "monthly": {
            const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
            startDate = monthStart;
            endDate = monthEnd;
            break;
          }
        }

        const params = new URLSearchParams({
          campaignId: selectedCampaignId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const response = await fetch(`/api/meetings?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch meetings");
        }

        const data = await response.json();

        // Transform API response to Meeting type
        const transformedMeetings: Meeting[] = (data.meetings || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          startTime: new Date(m.startTime),
          endTime: new Date(m.endTime),
          location: m.location,
          meetLink: m.meetLink,
          researchStatus: m.researchStatus,
          timezone: m.timezone,
          campaign: m.campaign,
        }));

        setMeetings(transformedMeetings);
      } catch (error) {
        console.error("Error fetching meetings:", error);
        setError("Failed to load meetings");
      } finally {
        setLoading(false);
      }
    }

    fetchMeetings();
  }, [selectedCampaignId, selectedDate, currentView]);

  // Keyboard shortcuts for view switching (D, W, M)
  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "d":
          setCurrentView("daily");
          break;
        case "w":
          setCurrentView("weekly");
          break;
        case "m":
          setCurrentView("monthly");
          break;
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meeting Dashboard</h1>
          <p className="text-gray-600">
            View your upcoming meetings with automated research briefs
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Keyboard shortcuts: <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">D</kbd> for Day,{" "}
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">W</kbd> for Week,{" "}
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">M</kbd> for Month
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CampaignFilter
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onCampaignChange={setSelectedCampaignId}
          />

          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
        </div>

        {/* Calendar Navigation */}
        <CalendarNavigation
          selectedDate={selectedDate}
          currentView={currentView}
          onDateChange={setSelectedDate}
          className="mb-6"
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Calendar Views */}
        {!loading && !error && (
          <>
            {currentView === "daily" && (
              <DailyView
                meetings={meetings}
                selectedDate={selectedDate}
                timezone={timezone}
              />
            )}

            {currentView === "weekly" && (
              <WeeklyView
                meetings={meetings}
                selectedDate={selectedDate}
                timezone={timezone}
              />
            )}

            {currentView === "monthly" && (
              <MonthlyView
                meetings={meetings}
                selectedDate={selectedDate}
                timezone={timezone}
              />
            )}
          </>
        )}

        {/* Empty State - No Campaign Selected */}
        {!loading && !error && !selectedCampaignId && (
          <div className="text-center py-12">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-lg font-medium text-gray-900">No campaign selected</p>
            <p className="text-sm text-gray-600 mt-1">
              Select a campaign from the dropdown to view meetings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
