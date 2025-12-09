import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

// Import all Inngest functions
import { processWebhook, processCalendarEvent } from "@/lib/inngest/functions/process-webhook";
import { generateResearch } from "@/lib/inngest/functions/generate-research";
// import { renewWebhooks } from "@/lib/inngest/functions/renew-webhooks";
// import { sendNotification } from "@/lib/inngest/functions/send-notification";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processWebhook,
    processCalendarEvent,
    generateResearch,
    // renewWebhooks,
    // sendNotification,
  ],
});
