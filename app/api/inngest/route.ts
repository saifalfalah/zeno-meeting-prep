import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

// Import all Inngest functions here when they're created
// import { processWebhook } from "@/lib/inngest/functions/process-webhook";
// import { generateResearch } from "@/lib/inngest/functions/generate-research";
// import { renewWebhooks } from "@/lib/inngest/functions/renew-webhooks";
// import { sendNotification } from "@/lib/inngest/functions/send-notification";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Add your Inngest functions here as they're implemented
    // processWebhook,
    // generateResearch,
    // renewWebhooks,
    // sendNotification,
  ],
});
