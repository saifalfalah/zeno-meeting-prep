"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResearchBriefPage, ResearchBriefPageProps } from "@/components/brief/ResearchBriefPage";
import { Button } from "@/components/ui/Button";
import { PDFDownloadButton } from "@/components/brief/PDFDownloadButton";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [briefData, setBriefData] = useState<ResearchBriefPageProps | null>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrief() {
      try {
        setLoading(true);
        setError(null);

        // First, fetch the meeting to get the brief ID
        const meetingResponse = await fetch(`/api/meetings/${meetingId}`);
        if (!meetingResponse.ok) {
          throw new Error("Failed to fetch meeting");
        }
        const meeting = await meetingResponse.json();

        if (!meeting.researchBriefId) {
          throw new Error("No research brief available for this meeting");
        }

        // Fetch the research brief
        const briefResponse = await fetch(`/api/research/briefs/${meeting.researchBriefId}`);
        if (!briefResponse.ok) {
          throw new Error("Failed to fetch research brief");
        }
        const brief = await briefResponse.json();

        setBriefData(brief);
        setBriefId(meeting.researchBriefId);
      } catch (err) {
        console.error("Error fetching brief:", err);
        setError(err instanceof Error ? err.message : "Failed to load research brief");
      } finally {
        setLoading(false);
      }
    }

    if (meetingId) {
      fetchBrief();
    }
  }, [meetingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading research brief...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Brief</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!briefData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <p className="text-gray-600">No brief data available</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header with back button and PDF download */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={() => router.push("/")} variant="outline">
            ← Back to Dashboard
          </Button>
          {briefId && <PDFDownloadButton briefId={briefId} />}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Research Brief</h1>
      </div>

      {/* Research Brief Content */}
      <ResearchBriefPage {...briefData} />
    </div>
  );
}
