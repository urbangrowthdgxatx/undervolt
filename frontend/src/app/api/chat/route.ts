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
        model: 'nemotron-mini',  // NVIDIA Nemotron Mini 4B
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

// Guardrails: sanitize and validate user input
function sanitizeInput(input: string): { safe: boolean; cleaned: string; reason?: string } {
  // Max length
  if (input.length > 500) {
    return { safe: false, cleaned: '', reason: 'Message too long. Please keep questions under 500 characters.' };
  }

  // Block obvious prompt injection patterns
  const injectionPatterns = [
    /ignore (all |previous |above )?instructions/i,
    /forget (everything|all|your)/i,
    /you are now/i,
    /act as/i,
    /pretend (to be|you're)/i,
    /new (instructions|prompt|rules)/i,
    /system prompt/i,
    /\[INST\]/i,
    /<\|.*\|>/,
    /```.*system/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      return { safe: false, cleaned: '', reason: 'I can only answer questions about Austin construction permits and infrastructure.' };
    }
  }

  // Check if question is remotely on-topic (Austin, permits, construction, energy)
  const onTopicKeywords = /austin|permit|solar|battery|generator|ev|charger|construction|building|energy|zip|neighborhood|trend|cluster|growth|demolition|remodel|hvac|pool|infrastructure/i;
  if (!onTopicKeywords.test(input) && input.length > 20) {
    return { safe: false, cleaned: '', reason: 'I specialize in Austin construction permits. Try asking about solar installations, generators, construction trends, or neighborhood data.' };
  }

  // Clean the input - remove potential control characters
  const cleaned = input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();

  return { safe: true, cleaned };
}

export async function POST(req: Request) {
  const { message } = await req.json();

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  // Apply guardrails
  const { safe, cleaned, reason } = sanitizeInput(message);
  if (!safe) {
    return Response.json({
      message: reason,
      storyBlock: {
        id: `guard-${Date.now()}`,
        headline: 'Off Topic',
        insight: reason,
        whyStoryWorthy: 'guardrail',
        confidence: 'high'
      }
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const intent = detectIntent(cleaned);

        // Engaging status messages
        const engagingMessages: Record<string, { searching: string; thinking: string }> = {
          energy: {
            searching: 'Scanning 26,000+ energy permits across Austin...',
            thinking: 'Finding patterns in solar, battery & generator data...'
          },
          trends: {
            searching: 'Analyzing decade of construction activity...',
            thinking: 'Spotting growth patterns and emerging trends...'
          },
          clusters: {
            searching: 'Mapping permit clusters across the city...',
            thinking: 'Identifying neighborhood patterns...'
          },
          luxury: {
            searching: 'Exploring high-value permit data...',
            thinking: 'Analyzing premium construction trends...'
          },
          general: {
            searching: 'Searching 2.3 million permits...',
            thinking: 'Connecting the dots...'
          },
        };

        const msgs = engagingMessages[intent] || engagingMessages.general;
        sendEvent(controller, 'status', { step: 'analyzing', message: msgs.searching });

        let responseText = '';

        // Get analytics data (no SQL shown to user)
        const analyticsData = await searchAnalytics(message);

        // Build LLM prompt based on intent
        let prompt = '';
        let fallbackText = '';

        // CRITICAL: Strongly constrain LLM to ONLY use provided data - no hallucinations
        const groundingInstruction = `
INSTRUCTIONS:
1. The answer IS in the data above - find the relevant numbers and report them.
2. Use the EXACT numbers from the data. Example: "- Generators: 7,293" means there are 7,293 generators.
3. Start your response directly with the insight - no preamble like "Based on the data" or "Here is a summary".
4. Keep response to 2-3 sentences, cite the actual numbers.
5. Answer this question: "${message}"
`;

        if (intent === 'energy') {
          prompt = `You are a data analyst. Answer this question about Austin energy infrastructure using ONLY the data provided below. Do NOT make up any numbers.\n\nQuestion: "${message}"\n\nVERIFIED DATA:\n${analyticsData}${groundingInstruction}`;
          fallbackText = `Austin's energy infrastructure:\n\n${analyticsData}`;
        } else if (intent === 'trends') {
          prompt = `You are a data analyst. Answer this question about Austin construction trends using ONLY the data provided below. Do NOT make up any numbers.\n\nQuestion: "${message}"\n\nVERIFIED DATA:\n${analyticsData}${groundingInstruction}`;
          fallbackText = `Construction trends in Austin:\n\n${analyticsData}`;
        } else if (intent === 'clusters') {
          prompt = `You are a data analyst. Answer this question about Austin construction clusters using ONLY the data provided below. Do NOT make up any numbers.\n\nQuestion: "${message}"\n\nVERIFIED DATA:\n${analyticsData}${groundingInstruction}`;
          fallbackText = `Austin permit clusters:\n\n${analyticsData}`;
        } else if (intent === 'luxury') {
          prompt = `You are a data analyst. Answer this question about Austin luxury construction using ONLY the data provided below. Do NOT make up any numbers.\n\nQuestion: "${message}"\n\nVERIFIED DATA:\n${analyticsData}${groundingInstruction}`;
          fallbackText = `Austin luxury construction trends:\n\n${analyticsData}`;
        } else {
          const insights = await getKeyInsights();
          prompt = `You are an Austin construction data analyst. Answer the user's question using ONLY the verified data below. Do NOT make up any numbers.\n\nQuestion: "${message}"\n\nVERIFIED DATA:\n${insights}${groundingInstruction}`;
          fallbackText = `I can help with Austin construction insights. Try asking about solar, generators, trends, or clusters.`;
        }

        sendEvent(controller, 'status', { step: 'processing', message: msgs.thinking });

        const llmResponse = await callOllama(prompt);
        responseText = llmResponse || fallbackText;

        sendEvent(controller, 'status', { step: 'complete', message: 'Done' });

        // Build response object matching ChatResponse schema
        // Strip preamble for headline
        const cleanedResponse = responseText
          .replace(/^(here is |here are |here's |this is |the following |based on |according to )/i, '')
          .replace(/^\*\*/g, '')
          .trim();
        const firstSentence = cleanedResponse.split(/[.!?\n]/)[0].replace(/\*\*/g, '').trim();
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
