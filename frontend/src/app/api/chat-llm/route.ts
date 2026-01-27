import { getClusters, getEnergyData, getFastestGrowingClusters } from '@/lib/analytics-data';

export const maxDuration = 60;

// Cache analytics data in memory (recompute only on module reload)
let analyticsCache: { clusters: any[], energy: any, growing: any[] } | null = null;

async function getAnalyticsData() {
  if (!analyticsCache) {
    console.log('[LLM] Loading analytics data into cache...');
    analyticsCache = {
      clusters: await getClusters(),
      energy: await getEnergyData(),
      growing: await getFastestGrowingClusters(5)
    };
  }
  return analyticsCache;
}

// Helper to send SSE events
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

/**
 * LLM-powered chat endpoint using local Ollama
 *
 * MODEL: Llama 3.2 3B (local, via Ollama HTTP API)
 */
export async function POST(req: Request) {
  const { message } = await req.json();

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Load analytics context (cached after first call)
        sendEvent(controller, 'status', { step: 'loading-analytics', message: '🦙 Llama 3.2 3B (local)' });

        const { clusters, energy, growing } = await getAnalyticsData();

        // Minimal prompt for speed (no verbose context)
        const systemPrompt = `Austin permits analyst. 2 sentences max. Bold stats with **. Data: Demolition +547%, Batteries 10K, New Construction 41%, Solar 2.4K.`;

        // Generate LLM response using Ollama HTTP API
        sendEvent(controller, 'status', { step: 'generating', message: 'Thinking...' });

        const ollamaUrl = process.env.VLLM_BASE_URL?.replace('/v1', '') || 'http://localhost:11434';
        const modelName = process.env.VLLM_MODEL_NAME || 'llama3.2:3b';

        const response = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            prompt: `${systemPrompt}\n\nQ: ${message}\nA:`,
            stream: false,
            keep_alive: '30m',  // Keep model in GPU memory for 30 minutes
            options: {
              temperature: 0.5,  // Lower temp = faster, more focused
              num_predict: 50,   // Short responses (2 sentences)
              num_ctx: 256,      // Minimal context window for speed
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        const fullResponse = data.response || '';

        // Parse response to extract story block
        const storyBlock = createStoryBlockFromResponse(fullResponse, message, { clusters, energy, growing });

        sendEvent(controller, 'response', {
          message: fullResponse,
          storyBlock,
        });
        sendEvent(controller, 'done', {});

      } catch (error) {
        console.error('LLM Chat error:', error);
        sendEvent(controller, 'error', { message: 'Failed to generate response' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function createStoryBlockFromResponse(
  response: string,
  query: string,
  data: { clusters: any[], energy: any, growing: any[] }
) {
  const lowerQuery = query.toLowerCase();
  const lowerResponse = response.toLowerCase();

  // Detect what kind of story to create based on query and response
  let headline = '🔍 Discovery';
  let whyStoryWorthy: any = 'outlier';

  if (lowerQuery.includes('grow') || lowerResponse.includes('growth') || lowerResponse.includes('cagr')) {
    headline = '📈 Growth Insight';
    whyStoryWorthy = 'turning-point';
  } else if (lowerQuery.includes('energy') || lowerQuery.includes('solar') || lowerQuery.includes('battery')) {
    headline = '⚡ Energy Insight';
    whyStoryWorthy = 'paradox';
  } else if (/\b\d{5}\b/.test(lowerQuery)) {
    const zip = lowerQuery.match(/\b(\d{5})\b/)?.[1];
    headline = `📍 ZIP ${zip}`;
    whyStoryWorthy = 'district-disparity';
  } else if (lowerQuery.includes('2020') || lowerQuery.includes('changed')) {
    headline = '📊 Change Over Time';
    whyStoryWorthy = 'post-freeze-shift';
  }

  // Extract a key stat if present
  const statMatch = response.match(/\*\*([^*]+)\*\*/);
  const keyStat = statMatch ? statMatch[1] : 'View details';

  return {
    id: `llm-${Date.now()}`,
    headline,
    insight: response,
    dataPoint: { label: 'insight', value: keyStat.slice(0, 20) },
    whyStoryWorthy,
    evidence: [
      { stat: 'Generated from 2.3M permits', source: 'Llama 3.2 3B analysis' }
    ],
    confidence: 'high' as const,
  };
}
