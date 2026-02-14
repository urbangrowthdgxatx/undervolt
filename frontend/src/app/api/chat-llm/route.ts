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

// Call LLM gateway via OpenAI-compatible API, or throw on failure
async function callLLM(systemPrompt: string, message: string): Promise<{ text: string; backend: string }> {
  const llmBase = process.env.VLLM_BASE_URL || 'http://localhost:4000/v1';
  const modelName = process.env.VLLM_MODEL_NAME || 'nemotron-3-nano';
  const llmKey = process.env.LLM_API_KEY;

  const response = await fetch(`${llmBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(llmKey && { 'Authorization': `Bearer ${llmKey}` }),
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 50,
      temperature: 0.5,
    })
  });

  if (!response.ok) throw new Error(`LLM error: ${response.statusText}`);
  const data = await response.json();
  return { text: data.choices?.[0]?.message?.content || '', backend: `${modelName} (local)` };
}

// Call NVIDIA NIM API and return the response text, or throw on failure
async function callNIM(systemPrompt: string, message: string): Promise<{ text: string; backend: string }> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const baseUrl = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.NVIDIA_NIM_MODEL || 'nvidia/llama-3.1-nemotron-nano-8b-v1';

  if (!apiKey) throw new Error('NVIDIA_NIM_API_KEY not set');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 100,
      temperature: 0.5,
    })
  });

  if (!response.ok) throw new Error(`NIM error: ${response.status} ${response.statusText}`);
  const data = await response.json();
  return { text: data.choices?.[0]?.message?.content || '', backend: `${model} (NIM)` };
}

/**
 * LLM-powered chat endpoint
 *
 * Tries local Ollama first, falls back to NVIDIA NIM cloud API
 */
export async function POST(req: Request) {
  const { message } = await req.json();

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendEvent(controller, 'status', { step: 'loading-analytics', message: 'Loading data...' });

        const { clusters, energy, growing } = await getAnalyticsData();

        const totalPermits = clusters.reduce((sum: number, c: any) => sum + (c.size || 0), 0);

        const realStats = `
VERIFIED DATA (use ONLY these numbers):
- Total permits: ${totalPermits.toLocaleString()}
- Solar: ${energy.solar_stats?.total_permits?.toLocaleString() || energy.by_type?.solar?.toLocaleString() || 'N/A'}
- Battery: ${energy.by_type?.battery?.toLocaleString() || 'N/A'}
- EV Chargers: ${energy.by_type?.ev_charger?.toLocaleString() || 'N/A'}
- Generators: ${energy.by_type?.generator?.toLocaleString() || 'N/A'}
- Largest category: ${growing[0]?.name || clusters[0]?.name || 'Unknown'} with ${(clusters[0]?.size || 0).toLocaleString()} permits
`;

        const systemPrompt = `Austin permits analyst. Use ONLY the verified data below. 2 sentences max. Bold key stats with **.
${realStats}`;

        // Try Ollama first, fall back to NIM
        let result: { text: string; backend: string };
        try {
          sendEvent(controller, 'status', { step: 'generating', message: 'Generating response...' });
          result = await callLLM(systemPrompt, message);
        } catch (llmErr) {
          console.log('[LLM] Gateway unavailable, falling back to NIM:', (llmErr as Error).message);
          sendEvent(controller, 'status', { step: 'generating', message: 'Using NVIDIA NIM...' });
          result = await callNIM(systemPrompt, message);
        }

        sendEvent(controller, 'status', { step: 'done', message: `via ${result.backend}` });

        const storyBlock = createStoryBlockFromResponse(result.text, message, { clusters, energy, growing });

        sendEvent(controller, 'response', {
          message: result.text,
          storyBlock,
          backend: result.backend,
        });
        sendEvent(controller, 'done', {});

      } catch (error) {
        console.error('LLM Chat error:', error);
        // Graceful fallback: suggest pre-analyzed questions instead of opaque error
        const fallbackMessage = `I couldn't reach the AI model right now. Try one of the pre-analyzed questions for insights powered by our analytics engine.`;
        sendEvent(controller, 'response', {
          message: fallbackMessage,
          storyBlock: {
            id: `fallback-${Date.now()}`,
            headline: 'AI Unavailable',
            insight: fallbackMessage,
            whyStoryWorthy: 'fallback',
            confidence: 'medium',
          },
          backend: 'fallback (no LLM)',
        });
        sendEvent(controller, 'done', {});
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
      { stat: 'Generated from Austin permit data', source: 'NVIDIA Nemotron 3 Nano analysis' }
    ],
    confidence: 'high' as const,
  };
}
