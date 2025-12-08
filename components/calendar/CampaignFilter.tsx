"use client";

import React, { useState, useRef, useEffect } from "react";

export interface Campaign {
  id: string;
  name: string;
}

export interface CampaignFilterProps {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onCampaignChange: (campaignId: string | null) => void;
  className?: string;
}

export function CampaignFilter({
  campaigns,
  selectedCampaignId,
  onCampaignChange,
  className = "",
}: CampaignFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (campaignId: string | null) => {
    onCampaignChange(campaignId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          inline-flex items-center justify-between gap-2 min-w-[200px]
          px-4 py-2 text-sm font-medium
          bg-white border border-gray-300 rounded-lg
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-colors
        "
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedCampaign ? selectedCampaign.name : "All Campaigns"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="
            absolute top-full mt-1 left-0 right-0 z-50
            bg-white border border-gray-200 rounded-lg shadow-lg
            max-h-60 overflow-auto
          "
          role="listbox"
        >
          <button
            onClick={() => handleSelect(null)}
            className={`
              w-full text-left px-4 py-2 text-sm hover:bg-gray-100
              ${selectedCampaignId === null ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-900"}
            `}
            role="option"
            aria-selected={selectedCampaignId === null}
          >
            All Campaigns
          </button>

          {campaigns.length > 0 && (
            <div className="border-t border-gray-200">
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => handleSelect(campaign.id)}
                  className={`
                    w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                    ${selectedCampaignId === campaign.id ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-900"}
                  `}
                  role="option"
                  aria-selected={selectedCampaignId === campaign.id}
                >
                  {campaign.name}
                </button>
              ))}
            </div>
          )}

          {campaigns.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No campaigns available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
