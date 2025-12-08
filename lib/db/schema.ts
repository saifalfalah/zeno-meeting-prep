import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const campaignStatusEnum = pgEnum("campaign_status", ["active", "paused"]);
export const webhookStatusEnum = pgEnum("webhook_status", ["active", "expired", "cancelled"]);
export const meetingStatusEnum = pgEnum("meeting_status", ["scheduled", "cancelled", "completed"]);
export const researchStatusEnum = pgEnum("research_status", [
  "none",
  "pending",
  "generating",
  "ready",
  "failed",
]);
export const confidenceRatingEnum = pgEnum("confidence_rating", ["HIGH", "MEDIUM", "LOW"]);
export const briefTypeEnum = pgEnum("brief_type", ["calendar", "adhoc"]);
export const sourceTypeEnum = pgEnum("source_type", [
  "company_website",
  "linkedin",
  "crunchbase",
  "news",
  "twitter",
  "other",
]);
export const responseStatusEnum = pgEnum("response_status", [
  "accepted",
  "declined",
  "tentative",
  "needsAction",
]);
export const adHocStatusEnum = pgEnum("adhoc_status", [
  "pending",
  "generating",
  "ready",
  "failed",
]);

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).notNull().unique(),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Campaigns Table
export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  status: campaignStatusEnum("status").default("active").notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  companyDomain: varchar("company_domain", { length: 255 }).notNull(),
  companyDescription: text("company_description"),
  offeringTitle: varchar("offering_title", { length: 255 }).notNull(),
  offeringDescription: text("offering_description").notNull(),
  targetCustomer: text("target_customer"),
  keyPainPoints: text("key_pain_points"), // JSON array stored as text
  googleCalendarId: varchar("google_calendar_id", { length: 255 }).notNull(),
  googleCalendarName: varchar("google_calendar_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Webhook Subscriptions Table
export const webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .notNull()
    .unique()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  googleResourceId: varchar("google_resource_id", { length: 255 }).notNull().unique(),
  googleChannelId: varchar("google_channel_id", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  status: webhookStatusEnum("status").notNull(),
  lastNotificationAt: timestamp("last_notification_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Companies Table
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  employeeCount: varchar("employee_count", { length: 100 }),
  revenue: varchar("revenue", { length: 100 }),
  fundingStage: varchar("funding_stage", { length: 100 }),
  headquarters: varchar("headquarters", { length: 255 }),
  website: varchar("website", { length: 500 }),
  crunchbaseUrl: varchar("crunchbase_url", { length: 500 }),
  lastResearchedAt: timestamp("last_researched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Prospects Table
export const prospects = pgTable("prospects", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  title: varchar("title", { length: 255 }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  location: varchar("location", { length: 255 }),
  linkedinUrl: varchar("linkedin_url", { length: 500 }),
  lastResearchedAt: timestamp("last_researched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 6. Meetings Table
export const meetings = pgTable("meetings", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  googleEventId: varchar("google_event_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timezone: varchar("timezone", { length: 100 }).notNull(),
  location: varchar("location", { length: 500 }),
  meetLink: varchar("meet_link", { length: 500 }),
  status: meetingStatusEnum("status").default("scheduled").notNull(),
  researchStatus: researchStatusEnum("research_status").default("none").notNull(),
  researchBriefId: uuid("research_brief_id"),
  researchFailureReason: text("research_failure_reason"),
  hasExternalAttendees: boolean("has_external_attendees").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Ad-Hoc Research Requests Table
export const adHocResearchRequests = pgTable("adhoc_research_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  prospectName: varchar("prospect_name", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  status: adHocStatusEnum("status").default("pending").notNull(),
  researchBriefId: uuid("research_brief_id"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 8. Research Briefs Table
export const researchBriefs = pgTable("research_briefs", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: briefTypeEnum("type").notNull(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  meetingId: uuid("meeting_id").references(() => meetings.id, { onDelete: "cascade" }),
  adHocRequestId: uuid("adhoc_request_id").references(() => adHocResearchRequests.id, {
    onDelete: "cascade",
  }),
  confidenceRating: confidenceRatingEnum("confidence_rating").notNull(),
  confidenceExplanation: text("confidence_explanation"),
  companyOverview: text("company_overview"),
  painPoints: text("pain_points"),
  howWeFit: text("how_we_fit"),
  openingLine: text("opening_line"),
  discoveryQuestions: text("discovery_questions"), // JSON array
  successOutcome: text("success_outcome"),
  watchOuts: text("watch_outs"),
  recentSignals: text("recent_signals"), // JSON array
  pdfUrl: varchar("pdf_url", { length: 500 }),
  generatedAt: timestamp("generated_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Prospect Info Table
export const prospectInfo = pgTable("prospect_info", {
  id: uuid("id").defaultRandom().primaryKey(),
  researchBriefId: uuid("research_brief_id")
    .notNull()
    .references(() => researchBriefs.id, { onDelete: "cascade" }),
  prospectId: uuid("prospect_id")
    .notNull()
    .references(() => prospects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  location: varchar("location", { length: 255 }),
  background: text("background"),
  reportsTo: varchar("reports_to", { length: 255 }),
  teamSize: varchar("team_size", { length: 100 }),
  recentActivity: text("recent_activity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 10. Research Sources Table
export const researchSources = pgTable("research_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  researchBriefId: uuid("research_brief_id")
    .notNull()
    .references(() => researchBriefs.id, { onDelete: "cascade" }),
  sourceType: sourceTypeEnum("source_type").notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  title: varchar("title", { length: 500 }),
  accessedAt: timestamp("accessed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Meeting Prospects Junction Table
export const meetingProspects = pgTable("meeting_prospects", {
  id: uuid("id").defaultRandom().primaryKey(),
  meetingId: uuid("meeting_id")
    .notNull()
    .references(() => meetings.id, { onDelete: "cascade" }),
  prospectId: uuid("prospect_id")
    .notNull()
    .references(() => prospects.id, { onDelete: "cascade" }),
  isOrganizer: boolean("is_organizer").default(false).notNull(),
  responseStatus: responseStatusEnum("response_status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for type-safe queries

export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
  adHocResearchRequests: many(adHocResearchRequests),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  webhookSubscription: one(webhookSubscriptions, {
    fields: [campaigns.id],
    references: [webhookSubscriptions.campaignId],
  }),
  meetings: many(meetings),
  researchBriefs: many(researchBriefs),
  adHocResearchRequests: many(adHocResearchRequests),
}));

export const webhookSubscriptionsRelations = relations(webhookSubscriptions, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [webhookSubscriptions.campaignId],
    references: [campaigns.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  prospects: many(prospects),
}));

export const prospectsRelations = relations(prospects, ({ one, many }) => ({
  company: one(companies, {
    fields: [prospects.companyId],
    references: [companies.id],
  }),
  meetingProspects: many(meetingProspects),
  prospectInfo: many(prospectInfo),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [meetings.campaignId],
    references: [campaigns.id],
  }),
  researchBrief: one(researchBriefs, {
    fields: [meetings.researchBriefId],
    references: [researchBriefs.id],
  }),
  meetingProspects: many(meetingProspects),
}));

export const adHocResearchRequestsRelations = relations(adHocResearchRequests, ({ one }) => ({
  user: one(users, {
    fields: [adHocResearchRequests.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [adHocResearchRequests.campaignId],
    references: [campaigns.id],
  }),
  researchBrief: one(researchBriefs, {
    fields: [adHocResearchRequests.researchBriefId],
    references: [researchBriefs.id],
  }),
}));

export const researchBriefsRelations = relations(researchBriefs, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [researchBriefs.campaignId],
    references: [campaigns.id],
  }),
  meeting: one(meetings, {
    fields: [researchBriefs.meetingId],
    references: [meetings.id],
  }),
  adHocRequest: one(adHocResearchRequests, {
    fields: [researchBriefs.adHocRequestId],
    references: [adHocResearchRequests.id],
  }),
  prospectInfo: many(prospectInfo),
  researchSources: many(researchSources),
}));

export const prospectInfoRelations = relations(prospectInfo, ({ one }) => ({
  researchBrief: one(researchBriefs, {
    fields: [prospectInfo.researchBriefId],
    references: [researchBriefs.id],
  }),
  prospect: one(prospects, {
    fields: [prospectInfo.prospectId],
    references: [prospects.id],
  }),
}));

export const researchSourcesRelations = relations(researchSources, ({ one }) => ({
  researchBrief: one(researchBriefs, {
    fields: [researchSources.researchBriefId],
    references: [researchBriefs.id],
  }),
}));

export const meetingProspectsRelations = relations(meetingProspects, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingProspects.meetingId],
    references: [meetings.id],
  }),
  prospect: one(prospects, {
    fields: [meetingProspects.prospectId],
    references: [prospects.id],
  }),
}));
