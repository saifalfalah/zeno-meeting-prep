CREATE TYPE "public"."adhoc_status" AS ENUM('pending', 'generating', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."brief_type" AS ENUM('calendar', 'adhoc');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."confidence_rating" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."research_status" AS ENUM('none', 'pending', 'generating', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('accepted', 'declined', 'tentative', 'needsAction');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('company_website', 'linkedin', 'crunchbase', 'news', 'twitter', 'other');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "adhoc_research_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"prospect_name" varchar(255),
	"company_name" varchar(255),
	"email" varchar(255),
	"status" "adhoc_status" DEFAULT 'pending' NOT NULL,
	"research_brief_id" uuid,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "campaign_status" DEFAULT 'active' NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"company_domain" varchar(255) NOT NULL,
	"company_description" text,
	"offering_title" varchar(255) NOT NULL,
	"offering_description" text NOT NULL,
	"target_customer" text,
	"key_pain_points" text,
	"google_calendar_id" varchar(255) NOT NULL,
	"google_calendar_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" varchar(255) NOT NULL,
	"name" varchar(255),
	"industry" varchar(255),
	"employee_count" varchar(100),
	"revenue" varchar(100),
	"funding_stage" varchar(100),
	"headquarters" varchar(255),
	"website" varchar(500),
	"crunchbase_url" varchar(500),
	"last_researched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "meeting_prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"prospect_id" uuid NOT NULL,
	"is_organizer" boolean DEFAULT false NOT NULL,
	"response_status" "response_status",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"google_event_id" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"timezone" varchar(100) NOT NULL,
	"location" varchar(500),
	"meet_link" varchar(500),
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"research_status" "research_status" DEFAULT 'none' NOT NULL,
	"research_brief_id" uuid,
	"research_failure_reason" text,
	"has_external_attendees" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospect_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_brief_id" uuid NOT NULL,
	"prospect_id" uuid NOT NULL,
	"title" varchar(255),
	"location" varchar(255),
	"background" text,
	"reports_to" varchar(255),
	"team_size" varchar(100),
	"recent_activity" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"title" varchar(255),
	"company_id" uuid,
	"location" varchar(255),
	"linkedin_url" varchar(500),
	"last_researched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prospects_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "research_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "brief_type" NOT NULL,
	"campaign_id" uuid NOT NULL,
	"meeting_id" uuid,
	"adhoc_request_id" uuid,
	"confidence_rating" "confidence_rating" NOT NULL,
	"confidence_explanation" text,
	"company_overview" text,
	"pain_points" text,
	"how_we_fit" text,
	"opening_line" text,
	"discovery_questions" text,
	"success_outcome" text,
	"watch_outs" text,
	"recent_signals" text,
	"pdf_url" varchar(500),
	"generated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_brief_id" uuid NOT NULL,
	"source_type" "source_type" NOT NULL,
	"url" varchar(1000) NOT NULL,
	"title" varchar(500),
	"accessed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"google_id" varchar(255) NOT NULL,
	"google_access_token" text,
	"google_refresh_token" text,
	"google_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"google_resource_id" varchar(255) NOT NULL,
	"google_channel_id" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" "webhook_status" NOT NULL,
	"last_notification_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_subscriptions_campaign_id_unique" UNIQUE("campaign_id"),
	CONSTRAINT "webhook_subscriptions_google_resource_id_unique" UNIQUE("google_resource_id"),
	CONSTRAINT "webhook_subscriptions_google_channel_id_unique" UNIQUE("google_channel_id")
);
--> statement-breakpoint
ALTER TABLE "adhoc_research_requests" ADD CONSTRAINT "adhoc_research_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adhoc_research_requests" ADD CONSTRAINT "adhoc_research_requests_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_prospects" ADD CONSTRAINT "meeting_prospects_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_prospects" ADD CONSTRAINT "meeting_prospects_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_info" ADD CONSTRAINT "prospect_info_research_brief_id_research_briefs_id_fk" FOREIGN KEY ("research_brief_id") REFERENCES "public"."research_briefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_info" ADD CONSTRAINT "prospect_info_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_briefs" ADD CONSTRAINT "research_briefs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_briefs" ADD CONSTRAINT "research_briefs_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_briefs" ADD CONSTRAINT "research_briefs_adhoc_request_id_adhoc_research_requests_id_fk" FOREIGN KEY ("adhoc_request_id") REFERENCES "public"."adhoc_research_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sources" ADD CONSTRAINT "research_sources_research_brief_id_research_briefs_id_fk" FOREIGN KEY ("research_brief_id") REFERENCES "public"."research_briefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;