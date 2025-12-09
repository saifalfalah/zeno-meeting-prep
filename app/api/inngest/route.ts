import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processWebhook } from "@/lib/inngest/functions/process-webhook";
import { generateResearch } from "@/lib/inngest/functions/generate-research";
import { sendResearchNotification } from "@/lib/inngest/functions/send-notification";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processWebhook,
    generateResearch,
    sendResearchNotification,
  ],
});
