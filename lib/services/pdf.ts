/**
 * PDF Generation Service
 *
 * Generates PDF versions of research briefs using React-PDF
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 4,
  },
  sectionContent: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#374151',
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  gridItem: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1f2937',
  },
  gridContent: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#4b5563',
  },
  list: {
    marginTop: 8,
  },
  listItem: {
    fontSize: 11,
    marginBottom: 6,
    color: '#374151',
  },
  footer: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '1 solid #e5e7eb',
    fontSize: 9,
    color: '#6b7280',
  },
  badge: {
    display: 'inline-block',
    padding: '4 8',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
})

export interface ResearchBriefPDFData {
  meetingTitle?: string
  companyName?: string
  prospectNames?: string[]
  generatedAt: Date
  confidenceRating: string
  confidenceExplanation?: string
  companyOverview?: string
  painPoints?: string
  howWeFit?: string
  openingLine?: string
  discoveryQuestions?: string[]
  successOutcome?: string
  watchOuts?: string
  recentSignals?: string[]
  sources?: Array<{ url: string; title?: string }>
}

// Create PDF Document component
function ResearchBriefDocument({ data }: { data: ResearchBriefPDFData }) {
  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          Text,
          { style: styles.title },
          `Pre-Call Intelligence Brief`
        ),
        React.createElement(
          Text,
          { style: styles.subtitle },
          data.meetingTitle || 'Research Brief'
        ),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `Generated: ${data.generatedAt.toLocaleDateString()} ${data.generatedAt.toLocaleTimeString()}`
        )
      ),

      // Quick Facts Grid
      React.createElement(
        View,
        { style: styles.grid },
        React.createElement(
          View,
          { style: styles.gridItem },
          React.createElement(Text, { style: styles.gridTitle }, 'Company'),
          React.createElement(
            Text,
            { style: styles.gridContent },
            data.companyName || 'Unknown'
          )
        ),
        React.createElement(
          View,
          { style: styles.gridItem },
          React.createElement(Text, { style: styles.gridTitle }, 'Prospects'),
          React.createElement(
            Text,
            { style: styles.gridContent },
            data.prospectNames?.join(', ') || 'Unknown'
          )
        ),
        React.createElement(
          View,
          { style: styles.gridItem },
          React.createElement(Text, { style: styles.gridTitle }, 'Confidence'),
          React.createElement(Text, { style: styles.gridContent }, data.confidenceRating)
        )
      ),

      // Company Overview
      data.companyOverview &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'What They Do'),
          React.createElement(Text, { style: styles.sectionContent }, data.companyOverview)
        ),

      // Pain Points
      data.painPoints &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Likely Pain Points'),
          React.createElement(Text, { style: styles.sectionContent }, data.painPoints)
        ),

      // How We Fit
      data.howWeFit &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'How We Fit'),
          React.createElement(Text, { style: styles.sectionContent }, data.howWeFit)
        ),

      // Call Strategy Grid
      React.createElement(
        View,
        { style: styles.grid },
        data.openingLine &&
          React.createElement(
            View,
            { style: styles.gridItem },
            React.createElement(Text, { style: styles.gridTitle }, 'Opening Line'),
            React.createElement(Text, { style: styles.gridContent }, data.openingLine)
          ),
        data.successOutcome &&
          React.createElement(
            View,
            { style: styles.gridItem },
            React.createElement(Text, { style: styles.gridTitle }, 'Success Outcome'),
            React.createElement(Text, { style: styles.gridContent }, data.successOutcome)
          )
      ),

      // Discovery Questions
      data.discoveryQuestions &&
        data.discoveryQuestions.length > 0 &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Discovery Questions'),
          React.createElement(
            View,
            { style: styles.list },
            ...data.discoveryQuestions.map((q, i) =>
              React.createElement(Text, { style: styles.listItem, key: i }, `${i + 1}. ${q}`)
            )
          )
        ),

      // Watch Outs
      data.watchOuts &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Watch Outs'),
          React.createElement(Text, { style: styles.sectionContent }, data.watchOuts)
        ),

      // Recent Signals
      data.recentSignals &&
        data.recentSignals.length > 0 &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Recent Signals'),
          React.createElement(
            View,
            { style: styles.list },
            ...data.recentSignals.map((s, i) =>
              React.createElement(Text, { style: styles.listItem, key: i }, `• ${s}`)
            )
          )
        ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          {},
          'Generated by Zeno Meeting Prep - Pre-Call Intelligence Dashboard'
        ),
        data.confidenceExplanation &&
          React.createElement(
            Text,
            { style: { marginTop: 5 } },
            `Confidence: ${data.confidenceExplanation}`
          )
      )
    )
  )
}

/**
 * Generates a PDF buffer from research brief data
 */
export async function generateResearchBriefPDF(
  data: ResearchBriefPDFData
): Promise<Buffer> {
  try {
    const doc = ResearchBriefDocument({ data })
    const buffer = await renderToBuffer(doc)
    return buffer
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
