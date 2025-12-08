/**
 * Application constants
 */

// Research status values
export const RESEARCH_STATUS = {
  NONE: "none",
  PENDING: "pending",
  GENERATING: "generating",
  READY: "ready",
  FAILED: "failed",
} as const;

// Meeting status values
export const MEETING_STATUS = {
  SCHEDULED: "scheduled",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

// Campaign status values
export const CAMPAIGN_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
} as const;

// Confidence ratings
export const CONFIDENCE_RATING = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

// Brief types
export const BRIEF_TYPE = {
  CALENDAR: "calendar",
  ADHOC: "adhoc",
} as const;

// Ad-hoc status values
export const ADHOC_STATUS = {
  PENDING: "pending",
  GENERATING: "generating",
  READY: "ready",
  FAILED: "failed",
} as const;

// Time thresholds
export const TIME_THRESHOLDS = {
  RESEARCH_CACHE_DURATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  COMPANY_CACHE_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  WEBHOOK_RENEWAL_THRESHOLD_MS: 2 * 24 * 60 * 60 * 1000, // 2 days before expiration
  WEBHOOK_MAX_DURATION_DAYS: 7, // Google Calendar limitation
} as const;

// Research timeouts
export const RESEARCH_TIMEOUTS = {
  PERPLEXITY_TIMEOUT_MS: 30000, // 30 seconds
  CLAUDE_TIMEOUT_MS: 60000, // 60 seconds
  TOTAL_RESEARCH_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// Status badge variants mapping
export const STATUS_BADGE_VARIANTS = {
  [RESEARCH_STATUS.NONE]: "default" as const,
  [RESEARCH_STATUS.PENDING]: "warning" as const,
  [RESEARCH_STATUS.GENERATING]: "info" as const,
  [RESEARCH_STATUS.READY]: "success" as const,
  [RESEARCH_STATUS.FAILED]: "error" as const,
};

// Confidence rating colors
export const CONFIDENCE_RATING_COLORS = {
  [CONFIDENCE_RATING.HIGH]: "text-green-600",
  [CONFIDENCE_RATING.MEDIUM]: "text-yellow-600",
  [CONFIDENCE_RATING.LOW]: "text-red-600",
};

// Calendar view types
export const CALENDAR_VIEWS = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
} as const;

// Source types for research
export const SOURCE_TYPES = {
  COMPANY_WEBSITE: "company_website",
  LINKEDIN: "linkedin",
  CRUNCHBASE: "crunchbase",
  NEWS: "news",
  TWITTER: "twitter",
  OTHER: "other",
} as const;
