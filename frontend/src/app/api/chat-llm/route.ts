import { getClusters, getEnergyData, getFastestGrowingClusters } from '@/lib/analytics-data';

export const maxDuration = 60;

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
        // Load analytics context
        sendEvent(controller, 'status', { step: 'loading-analytics', message: '🦙 Llama 3.2 3B (local)' });

        const clusters = getClusters();
        const energy = getEnergyData();
        const growing = getFastestGrowingClusters(5);

        // Build rich context
        const analyticsContext = `
# Austin Construction Data (2.3M Permits Analyzed)

## 8 Permit Clusters (ML Classification)
${clusters.map(c => `- ${c.name}: ${c.size.toLocaleString()} permits (${c.percentage.toFixed(1)}%)`).join('\n')}

## Energy Infrastructure (18,050 permits)
- Solar: ${energy.solar_stats.total_permits.toLocaleString()} installations, ${(energy.solar_stats.total_capacity_kw / 1000).toFixed(1)} MW total
- Batteries: ${(energy.by_type.battery || 0).toLocaleString()} systems (4x more than solar!)
- EV Chargers: ${(energy.by_type.ev_charger || 0).toLocaleString()}
- Top Battery ZIP: ${energy.by_zip.sort((a, b) => b.battery - a.battery)[0].zip_code}
- Top Solar ZIP: ${energy.by_zip.sort((a, b) => b.solar - a.solar)[0].zip_code}

## Growth Trends (CAGR 2020-2025)
${growing.map(g => `- ${g.name}: +${g.cagr.toFixed(1)}%`).join('\n')}

## Key Insights
- Demolition exploded +547% CAGR - urban redevelopment boom
- Battery surprise: 10,377 systems vs 2,436 solar
- ZIP 78758: Battery hub (801 systems)
- ZIP 78744: Solar leader (572 installations)
`;

        // Simplified, shorter prompt for faster responses
        const systemPrompt = `Austin construction analyst. 2-3 sentences max. Bold key stats with **. Context: ${clusters[0].name} (${clusters[0].size.toLocaleString()} permits), Demolition +547%, Batteries: 10,377 vs Solar: 2,436.`;

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
              num_predict: 80,   // Reduced from 200 for speed
              num_ctx: 512,      // Smaller context window
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
