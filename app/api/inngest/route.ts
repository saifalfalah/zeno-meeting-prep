import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processWebhook } from "@/lib/inngest/functions/process-webhook";
import { generateResearch } from "@/lib/inngest/functions/generate-research";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processWebhook,
    generateResearch,
  ],
});
