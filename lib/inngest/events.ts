/**
 * Inngest Event Types
 * Define all event types and their payloads here
 */

// Webhook processing events
export type WebhookProcessingEvent = {
  name: "webhook/google-calendar.received";
  data: {
    campaignId: string;
    googleResourceId: string;
    googleChannelId: string;
    notificationId: string;
  };
};

// Research generation events
export type ResearchGenerationEvent = {
  name: "research/generate.requested";
  data: {
    type: "calendar" | "adhoc";
    meetingId?: string;
    adHocRequestId?: string;
    campaignId: string;
    prospects: Array<{
      email: string;
      name?: string;
      companyDomain?: string;
    }>;
    requestedAt: string;
  };
};

export type ResearchCompletedEvent = {
  name: "research/generate.completed";
  data: {
    type: "calendar" | "adhoc";
    meetingId?: string;
    adHocRequestId?: string;
    researchBriefId: string;
    completedAt: string;
  };
};

export type ResearchFailedEvent = {
  name: "research/generate.failed";
  data: {
    type: "calendar" | "adhoc";
    meetingId?: string;
    adHocRequestId?: string;
    error: string;
    failedAt: string;
  };
};

// Webhook renewal events
export type WebhookRenewalEvent = {
  name: "webhook/renew.scheduled";
  data: {
    campaignId: string;
    webhookSubscriptionId: string;
  };
};

// Notification events
export type NotificationEvent = {
  name: "notification/send.requested";
  data: {
    type: "research_completed" | "research_failed" | "webhook_expired";
    userId: string;
    campaignId?: string;
    meetingId?: string;
    message: string;
  };
};

// Union type of all events
export type InngestEvents =
  | WebhookProcessingEvent
  | ResearchGenerationEvent
  | ResearchCompletedEvent
  | ResearchFailedEvent
  | WebhookRenewalEvent
  | NotificationEvent;
