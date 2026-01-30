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
 * MODEL: NVIDIA Nemotron Mini 4B (local, via Ollama HTTP API)
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
        sendEvent(controller, 'status', { step: 'loading-analytics', message: '🤖 Nemotron Mini 4B (local)' });

        const { clusters, energy, growing } = await getAnalyticsData();

        // Build real data context from actual database stats
        const realStats = `
VERIFIED DATA (use ONLY these numbers):
- Total permits: 2.3M
- Solar: ${energy.solar_stats?.total_permits?.toLocaleString() || energy.by_type?.solar?.toLocaleString() || '26,050'}
- Battery: ${energy.by_type?.battery?.toLocaleString() || '1,172'}
- EV Chargers: ${energy.by_type?.ev_charger?.toLocaleString() || '1,490'}
- Generators: ${energy.by_type?.generator?.toLocaleString() || '7,293'}
- Fastest growing: ${growing[0]?.name || 'Demolition'} at +${growing[0]?.cagr || 547}% CAGR (Compound Annual Growth Rate)
`;

        // Minimal prompt for speed - with REAL data
        const systemPrompt = `Austin permits analyst. Use ONLY the verified data below. 2 sentences max. Bold key stats with **.
${realStats}`;

        // Generate LLM response using Ollama HTTP API
        sendEvent(controller, 'status', { step: 'generating', message: 'Thinking...' });

        const ollamaUrl = process.env.VLLM_BASE_URL?.replace('/v1', '') || 'http://localhost:11434';
        const modelName = process.env.VLLM_MODEL_NAME || 'nemotron-mini';

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
      { stat: 'Generated from 2.3M permits', source: 'NVIDIA Nemotron Mini analysis' }
    ],
    confidence: 'high' as const,
  };
}
