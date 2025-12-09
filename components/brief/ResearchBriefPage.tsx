import React from "react";
import { BriefHeader, BriefHeaderProps } from "./BriefHeader";
import { QuickFacts, QuickFactsProps } from "./QuickFacts";
import { DeepDive, DeepDiveProps } from "./DeepDive";
import { CallStrategy, CallStrategyProps } from "./CallStrategy";
import { BriefFooter, BriefFooterProps } from "./BriefFooter";

export interface ResearchBriefPageProps {
  header: BriefHeaderProps;
  quickFacts: QuickFactsProps;
  deepDive: DeepDiveProps;
  callStrategy: CallStrategyProps;
  footer: BriefFooterProps;
}

export function ResearchBriefPage({
  header,
  quickFacts,
  deepDive,
  callStrategy,
  footer,
}: ResearchBriefPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header Section */}
      <div data-testid="header-section">
        <BriefHeader {...header} />
      </div>

      {/* Quick Facts Section */}
      <div data-testid="quick-facts-section">
        <QuickFacts {...quickFacts} />
      </div>

      {/* Deep Dive Section */}
      <div data-testid="deep-dive-section">
        <DeepDive {...deepDive} />
      </div>

      {/* Call Strategy Section */}
      <div data-testid="call-strategy-section">
        <CallStrategy {...callStrategy} />
      </div>

      {/* Footer Section */}
      <div data-testid="footer-section">
        <BriefFooter {...footer} />
      </div>
    </div>
  );
}
