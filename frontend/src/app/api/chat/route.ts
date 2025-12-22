import { searchAnalytics, getKeyInsights } from '@/lib/analytics-data';

export const maxDuration = 60;

// Helper to send SSE events
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
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
        model: 'neural-chat',
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

        // Get analytics data
        const analyticsData = searchAnalytics(message);

        if (intent === 'energy') {
          // Energy queries: Fast fuzzy + LLM summary
          sendEvent(controller, 'status', { step: 'processing', message: 'Summarizing energy data...' });
          
          const summary = await callOllama(
            `Summarize this Austin energy infrastructure data in 2-3 sentences:\n\n${analyticsData}`
          );
          
          responseText = summary || `Austin's energy infrastructure:\n\n${analyticsData}`;
        } else if (intent === 'trends') {
          // Trend queries: Analytics + LLM analysis
          sendEvent(controller, 'status', { step: 'processing', message: 'Analyzing trends...' });
          
          const analysis = await callOllama(
            `Analyze these Austin construction trends and growth patterns. What are the key insights?\n\n${analyticsData}`
          );
          
          responseText = analysis || `Construction trends in Austin:\n\n${analyticsData}`;
        } else if (intent === 'clusters') {
          // Cluster queries: Fast fuzzy + LLM explanation
          sendEvent(controller, 'status', { step: 'processing', message: 'Analyzing clusters...' });
          
          const explanation = await callOllama(
            `Explain these Austin construction clusters in simple terms:\n\n${analyticsData}`
          );
          
          responseText = explanation || `Austin permit clusters:\n\n${analyticsData}`;
        } else if (intent === 'luxury') {
          // Luxury/pool queries: Analytics + LLM neighborhood analysis
          sendEvent(controller, 'status', { step: 'processing', message: 'Analyzing luxury trends...' });
          
          const analysis = await callOllama(
            `Analyze these Austin luxury construction and pool trends by neighborhood:\n\n${analyticsData}`
          );
          
          responseText = analysis || `Austin luxury construction trends:\n\n${analyticsData}`;
        } else {
          // General questions: Full LLM chat with all context
          sendEvent(controller, 'status', { step: 'processing', message: 'Thinking...' });
          
          const insights = getKeyInsights();
          const fullResponse = await callOllama(
            `You are an Austin construction expert. User asks: "${message}"\n\nContext:\n${insights}\n\nRespond naturally and helpfully.`
          );
          
          responseText = fullResponse || `I can help with Austin construction insights. Try asking about solar, generators, trends, or clusters.`;
        }

        sendEvent(controller, 'status', { step: 'complete', message: 'Done' });

        // Build response object
        const responseObject = {
          text: responseText,
          blocks: [{ type: 'text', content: responseText }],
          insights: analyticsData,
          intent: intent,
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
