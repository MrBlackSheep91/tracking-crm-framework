// payloadRouter.ts

import { MICROWORKFLOW_URLS } from './server'; // Assuming MICROWORKFLOW_URLS is exported
import { sendToMicroWorkflow } from './server'; // Assuming sendToMicroWorkflow is exported

interface PayloadRoutingRule {
  name: string;
  condition: (payload: any) => boolean;
  workflow: keyof typeof MICROWORKFLOW_URLS;
  transform?: (payload: any) => any; // Optional transformation before sending
}

const routingRules: PayloadRoutingRule[] = [
  {
    name: 'Direct Lead Capture',
    condition: (payload) => (payload.email || payload.name || payload.phone) && !payload.session,
    workflow: 'LEAD_PROCESSOR',
  },
  {
    name: 'Full Visitor Tracking',
    condition: (payload) => payload.session && payload.session.sessionId && payload.events && Array.isArray(payload.events) && payload.events.length > 0,
    workflow: 'VISITOR_PROCESSOR',
    transform: (payload) => ({ body: payload }), // Wrap payload in 'body'
  },
  {
    name: 'Session Only Tracking',
    condition: (payload) => payload.session && payload.session.sessionId && (!payload.events || payload.events.length === 0),
    workflow: 'VISITOR_PROCESSOR',
    transform: (payload) => ({ body: payload }), // Wrap payload in 'body'
  },
  // Fallback rule - should be last
  {
    name: 'Activity Logger Fallback',
    condition: () => true, // Always matches if previous rules don't
    workflow: 'ACTIVITY_LOGGER',
  },
];

export async function routePayload(payload: any) {
  console.log('🧠 Analyzing payload for intelligent routing...');

  for (const rule of routingRules) {
    if (rule.condition(payload)) {
      console.log(`🎯 Routing to ${rule.workflow} (${rule.name})`);
      const transformedPayload = rule.transform ? rule.transform(payload) : payload;
      return await sendToMicroWorkflow(MICROWORKFLOW_URLS[rule.workflow], transformedPayload, rule.workflow);
    }
  }

  // This part should ideally not be reached if a fallback rule is present
  console.warn('⚠️ No routing rule matched. Sending to default fallback (if any).');
  return { success: false, error: 'No routing rule matched' };
}
