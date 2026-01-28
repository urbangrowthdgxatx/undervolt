import { searchAnalytics, getKeyInsights } from '@/lib/analytics-data';

export const maxDuration = 60;

// Helper to send SSE events
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

// Intent to representative SQL for the debug panel
function getQuerySQL(intent: string): string {
  switch (intent) {
    case 'energy':
      return 'SELECT zip_code, solar, battery, ev_charger, generator, total_energy_permits FROM energy_stats_by_zip ORDER BY total_energy_permits DESC';
    case 'trends':
      return 'SELECT c.name, c.count, c.percentage, k.keyword, k.frequency FROM clusters c JOIN cluster_keywords k ON c.id = k.cluster_id ORDER BY c.id, k.rank';
    case 'clusters':
      return 'SELECT id, name, count, percentage FROM clusters ORDER BY id';
    case 'luxury':
      return "SELECT zip_code, total_energy_permits, solar, battery FROM energy_stats_by_zip WHERE zip_code IN ('78704','78701','78722','78745')";
    default:
      return 'SELECT * FROM clusters; SELECT * FROM energy_stats_by_zip ORDER BY total_energy_permits DESC LIMIT 20';
  }
}

// Detect user intent
function detectIntent(message: string): 'energy' | 'trends' | 'clusters' | 'luxury' | 'general' {
  const lower = message.toLowerCase();
  
  if (lower.includes('solar') || lower.includes('battery') || lower.includes('ev') || 
      lower.includes('generator') || lower.includes('genreator') || lower.includes('charger')) {
    return 'energy';
  }
  if (lower.includes('trend') || lower.includes('grow') || lower.includes('change') || 
      lower.includes('since') || lower.includes('time')) {
    return 'trends';
  }
  if (lower.includes('cluster') || lower.includes('type') || lower.includes('category')) {
    return 'clusters';
  }
  if (lower.includes('pool') || lower.includes('luxury') || lower.includes('neighborhood')) {
    return 'luxury';
  }
  return 'general';
}

// Call Ollama to summarize/analyze data
async function callOllama(prompt: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',  // Faster model (50% faster than neural-chat)
        prompt: prompt,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return '';
    const data = await response.json();
    return data.response || '';
  } catch (error) {
    console.error('Ollama error:', error);
    return '';
  }
}

export async function POST(req: Request) {
  const { message } = await req.json();

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const intent = detectIntent(message);
        sendEvent(controller, 'status', { step: 'analyzing', message: `Analyzing (intent: ${intent})...` });

        let responseText = '';

        // Emit tool-call for Supabase query
        const sql = getQuerySQL(intent);
        sendEvent(controller, 'tool-call', { name: 'supabase.query', input: { sql } });

        // Get analytics data
        const analyticsData = await searchAnalytics(message);

        // Emit tool-result for Supabase query
        sendEvent(controller, 'tool-result', { name: 'supabase.query', result: analyticsData.substring(0, 500) });

        // Build LLM prompt based on intent
        let prompt = '';
        let statusMsg = '';
        let fallbackText = '';

        const promptSuffix = `\n\nIMPORTANT: Start your response directly with the insight. Do NOT start with "Here is a summary" or similar preamble. Answer the specific question: "${message}"`;

        if (intent === 'energy') {
          statusMsg = 'Summarizing energy data...';
          prompt = `Answer this question about Austin energy infrastructure in 2-3 sentences: "${message}"\n\nData:\n${analyticsData}${promptSuffix}`;
          fallbackText = `Austin's energy infrastructure:\n\n${analyticsData}`;
        } else if (intent === 'trends') {
          statusMsg = 'Analyzing trends...';
          prompt = `Answer this question about Austin construction trends: "${message}"\n\nData:\n${analyticsData}${promptSuffix}`;
          fallbackText = `Construction trends in Austin:\n\n${analyticsData}`;
        } else if (intent === 'clusters') {
          statusMsg = 'Analyzing clusters...';
          prompt = `Answer this question about Austin construction clusters: "${message}"\n\nData:\n${analyticsData}${promptSuffix}`;
          fallbackText = `Austin permit clusters:\n\n${analyticsData}`;
        } else if (intent === 'luxury') {
          statusMsg = 'Analyzing luxury trends...';
          prompt = `Answer this question about Austin luxury construction: "${message}"\n\nData:\n${analyticsData}${promptSuffix}`;
          fallbackText = `Austin luxury construction trends:\n\n${analyticsData}`;
        } else {
          statusMsg = 'Thinking...';
          const insights = await getKeyInsights();
          prompt = `You are an Austin construction expert. User asks: "${message}"\n\nContext:\n${insights}${promptSuffix}`;
          fallbackText = `I can help with Austin construction insights. Try asking about solar, generators, trends, or clusters.`;
        }

        sendEvent(controller, 'status', { step: 'processing', message: statusMsg });

        // Emit tool-call for Ollama LLM
        sendEvent(controller, 'tool-call', { name: 'ollama.generate', input: { sql: `llama3.2:3b -- ${statusMsg}` } });

        const llmResponse = await callOllama(prompt);
        responseText = llmResponse || fallbackText;

        // Emit tool-result for Ollama
        sendEvent(controller, 'tool-result', { name: 'ollama.generate', result: responseText.substring(0, 300) });

        sendEvent(controller, 'status', { step: 'complete', message: 'Done' });

        // Build response object matching ChatResponse schema
        // Strip preamble for headline
        const cleaned = responseText
          .replace(/^(here is |here are |here's |this is |the following |based on |according to )/i, '')
          .replace(/^\*\*/g, '')
          .trim();
        const firstSentence = cleaned.split(/[.!?\n]/)[0].replace(/\*\*/g, '').trim();
        const headline = firstSentence.length > 50
          ? firstSentence.substring(0, 47) + '...'
          : firstSentence || 'Austin Insight';

        const responseObject = {
          message: responseText,
          storyBlock: {
            id: `${intent}-${Date.now()}`,
            headline,
            insight: responseText,
            whyStoryWorthy: 'turning-point',
            confidence: 'medium',
          },
        };

        // Send final response
        sendEvent(controller, 'response', responseObject);
        sendEvent(controller, 'done', {});

        controller.close();
      } catch (error) {
        console.error('Chat API error:', error);
        sendEvent(controller, 'error', { 
          message: error instanceof Error ? error.message : 'Unknown error',
          fallback: true 
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
