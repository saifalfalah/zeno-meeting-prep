'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

export interface PDFDownloadButtonProps {
  briefId: string;
  buttonText?: string;
  className?: string;
}

/**
 * Button component for downloading research briefs as PDF
 * Handles the download flow with loading and error states
 */
export function PDFDownloadButton({
  briefId,
  buttonText = 'Download PDF',
  className = '',
}: PDFDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);

      // Fetch the PDF from the API
      const response = await fetch(`/api/research/briefs/${briefId}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Convert response to blob
      const blob = await response.blob();

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'research-brief.pdf';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        variant="primary"
        className={className}
        aria-label={isDownloading ? 'Downloading PDF' : buttonText}
      >
        {/* Download Icon */}
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>
        {isDownloading ? 'Downloading...' : buttonText}
      </Button>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
