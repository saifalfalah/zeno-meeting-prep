import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// PDF types based on the test requirements
export interface BriefPDFData {
  meeting: {
    title: string;
    startTime: Date;
    timezone: string;
  };
  campaign: {
    companyName: string;
    offeringTitle: string;
  };
  brief: {
    confidenceRating: 'HIGH' | 'MEDIUM' | 'LOW';
    confidenceExplanation?: string | null;
    companyOverview?: string | null;
    painPoints?: string | null;
    howWeFit?: string | null;
    openingLine?: string | null;
    discoveryQuestions?: string[] | null;
    successOutcome?: string | null;
    watchOuts?: string | null;
    recentSignals?: string[] | null;
  };
  prospects: Array<{
    name?: string | null;
    title?: string | null;
    companyName?: string | null;
    email?: string | null;
  }>;
  company?: {
    name?: string | null;
    industry?: string | null;
    employeeCount?: string | null;
    fundingStage?: string | null;
  };
  sources: Array<{
    sourceType: string;
    url: string;
    title?: string | null;
  }>;
}

// Define PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #1f2937',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  badge: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: '4pt 8pt',
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  badgeHigh: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  badgeMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeLow: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  list: {
    marginTop: 6,
  },
  listItem: {
    fontSize: 11,
    marginBottom: 4,
    paddingLeft: 12,
    color: '#374151',
  },
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTop: '1pt solid #e5e7eb',
  },
  source: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
  },
  prospect: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  prospectName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  prospectDetail: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 1,
  },
});

// Format date for display
const formatDate = (date: Date, timezone: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short',
  }).format(date);
};

// Get badge style based on confidence rating
const getBadgeStyle = (rating: 'HIGH' | 'MEDIUM' | 'LOW') => {
  switch (rating) {
    case 'HIGH':
      return styles.badgeHigh;
    case 'MEDIUM':
      return styles.badgeMedium;
    case 'LOW':
      return styles.badgeLow;
  }
};

// PDF Document Component
const BriefPDFDocument = ({ data }: { data: BriefPDFData }) => {
  const { meeting, campaign, brief, prospects, company, sources } = data;

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, meeting.title),
        React.createElement(
          Text,
          { style: styles.subtitle },
          formatDate(meeting.startTime, meeting.timezone)
        ),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `${campaign.companyName} - ${campaign.offeringTitle}`
        )
      ),

      // Confidence Badge
      React.createElement(
        View,
        { style: [styles.badge, getBadgeStyle(brief.confidenceRating)] },
        React.createElement(Text, null, `Confidence: ${brief.confidenceRating}`)
      ),
      brief.confidenceExplanation &&
        React.createElement(
          View,
          { style: { marginBottom: 16 } },
          React.createElement(Text, { style: styles.sectionContent }, brief.confidenceExplanation)
        ),

      // Prospects Section
      prospects.length > 0 &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Meeting Attendees'),
          ...prospects.map((prospect, idx) =>
            React.createElement(
              View,
              { key: idx, style: styles.prospect },
              prospect.name &&
                React.createElement(Text, { style: styles.prospectName }, prospect.name),
              prospect.title &&
                React.createElement(Text, { style: styles.prospectDetail }, prospect.title),
              prospect.companyName &&
                React.createElement(Text, { style: styles.prospectDetail }, prospect.companyName),
              prospect.email &&
                React.createElement(Text, { style: styles.prospectDetail }, prospect.email)
            )
          )
        ),

      // Company Overview Section
      company &&
        (company.name || company.industry || company.employeeCount || company.fundingStage) &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Company Information'),
          company.name &&
            React.createElement(
              Text,
              { style: styles.sectionContent },
              `Name: ${company.name}`
            ),
          company.industry &&
            React.createElement(
              Text,
              { style: styles.sectionContent },
              `Industry: ${company.industry}`
            ),
          company.employeeCount &&
            React.createElement(
              Text,
              { style: styles.sectionContent },
              `Size: ${company.employeeCount} employees`
            ),
          company.fundingStage &&
            React.createElement(
              Text,
              { style: styles.sectionContent },
              `Funding: ${company.fundingStage}`
            )
        ),

      // What They Do
      brief.companyOverview &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'What They Do'),
          React.createElement(Text, { style: styles.sectionContent }, brief.companyOverview)
        ),

      // Recent Signals
      brief.recentSignals &&
        brief.recentSignals.length > 0 &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Recent Signals'),
          React.createElement(
            View,
            { style: styles.list },
            ...brief.recentSignals.map((signal, idx) =>
              React.createElement(
                Text,
                { key: idx, style: styles.listItem },
                `• ${signal}`
              )
            )
          )
        ),

      // Likely Pain Points
      brief.painPoints &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Likely Pain Points'),
          React.createElement(Text, { style: styles.sectionContent }, brief.painPoints)
        ),

      // How We Fit
      brief.howWeFit &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'How We Fit'),
          React.createElement(Text, { style: styles.sectionContent }, brief.howWeFit)
        ),

      // Opening Line
      brief.openingLine &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Opening Line'),
          React.createElement(Text, { style: styles.sectionContent }, brief.openingLine)
        ),

      // Discovery Questions
      brief.discoveryQuestions &&
        brief.discoveryQuestions.length > 0 &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Discovery Questions'),
          React.createElement(
            View,
            { style: styles.list },
            ...brief.discoveryQuestions.map((question, idx) =>
              React.createElement(
                Text,
                { key: idx, style: styles.listItem },
                `${idx + 1}. ${question}`
              )
            )
          )
        ),

      // Success Outcome
      brief.successOutcome &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Success Outcome'),
          React.createElement(Text, { style: styles.sectionContent }, brief.successOutcome)
        ),

      // Watch Outs
      brief.watchOuts &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Watch Outs'),
          React.createElement(Text, { style: styles.sectionContent }, brief.watchOuts)
        ),

      // Sources
      sources.length > 0 &&
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(Text, { style: styles.sectionTitle }, 'Sources'),
          ...sources.map((source, idx) =>
            React.createElement(
              Text,
              { key: idx, style: styles.source },
              `${idx + 1}. ${source.title || source.sourceType}: ${source.url}`
            )
          )
        )
    )
  );
};

/**
 * Generate PDF buffer from research brief data
 * @param data - Research brief data to convert to PDF
 * @returns Buffer containing the PDF
 */
export async function generateBriefPDF(data: BriefPDFData): Promise<Buffer> {
  // BriefPDFDocument returns a Document element, so we can call it directly
  const pdfDoc = pdf(BriefPDFDocument({ data }));
  const blob = await pdfDoc.toBlob();

  // Convert Blob to Buffer for Node.js environments
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
