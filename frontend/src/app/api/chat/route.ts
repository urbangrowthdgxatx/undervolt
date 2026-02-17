import { searchAnalytics, getKeyInsights } from '@/lib/analytics-data';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export const maxDuration = 60;

// Active model for serving cached answers (set via env var or defaults to nemotron)
function getActiveModel(): string {
  return process.env.ACTIVE_LLM_MODEL || 'nvidia/llama-3.1-nemotron-nano-8b-v1';
}

// Check if question is a pre-cached storyline question (for the active model)
async function isCachedQuestion(question: string): Promise<boolean> {
  const hash = hashQuestion(question);
  const model = getActiveModel();

  // Try with model filter first (post-migration)
  const { data, error } = await supabase
    .from('cached_answers')
    .select('id')
    .eq('question_hash', hash)
    .eq('model', model)
    .single();

  if (!error && data) return true;

  // Fallback: query without model filter (works before and after migration)
  const { data: fallback } = await supabase
    .from('cached_answers')
    .select('id')
    .eq('question_hash', hash)
    .limit(1)
    .single();
  return !!fallback;
}

// Hash question for cache lookup
function hashQuestion(q: string): string {
  return crypto.createHash('md5').update(q.toLowerCase().trim()).digest('hex');
}

// Check cache for pre-built answers (prefer active model, fallback to any)
async function getCachedAnswer(question: string): Promise<any | null> {
  try {
    const hash = hashQuestion(question);
    const model = getActiveModel();

    // Try active model first (post-migration: has model column)
    const { data, error } = await supabase
      .from('cached_answers')
      .select('answer, question, model')
      .eq('question_hash', hash)
      .eq('model', model)
      .single();

    if (!error && data) {
      const answer = data.answer;
      if (answer && typeof answer === 'object') {
        answer._question = data.question;
        answer._model = data.model;
      }
      return answer;
    }

    // Fallback: query without model filter (works before and after migration)
    const { data: fallback, error: fbError } = await supabase
      .from('cached_answers')
      .select('answer, question')
      .eq('question_hash', hash)
      .limit(1)
      .single();

    if (!fbError && fallback) {
      const answer = fallback.answer;
      if (answer && typeof answer === 'object') {
        answer._question = fallback.question;
      }
      return answer;
    }
    return null;
  } catch {
    return null;
  }
}

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

// Extract a key statistic from answer text — prefer numbers over sentences
function extractKeyStat(text: string): string | null {
  // 1. Percentage (e.g., "+340%", "547%")
  const pctMatch = text.match(/(\+?\d[\d,]*\.?\d*%)/);
  if (pctMatch) return pctMatch[1];

  // 2. Ratio (e.g., "22:1", "1:9")
  const ratioMatch = text.match(/(\d+:\d+)/);
  if (ratioMatch) return ratioMatch[1];

  // 3. Multiplier (e.g., "5x more")
  const multMatch = text.match(/(\d+x\s+(?:more|less|higher|lower|greater))/i);
  if (multMatch) return multMatch[1];

  // 4. Number with unit from bold text
  const boldNumMatch = text.match(/\*\*([\d,]+(?:\.\d+)?)\*\*\s*(installations?|permits?|systems?|chargers?|generators?|units?|homes?|kW|MW)?/i);
  if (boldNumMatch) return boldNumMatch[2] ? `${boldNumMatch[1]} ${boldNumMatch[2]}` : boldNumMatch[1];

  // 5. Large number with unit in plain text
  const numMatch = text.match(/([\d,]+(?:\.\d+)?)\s+(installations?|permits?|systems?|chargers?|generators?|units?|homes?|projects?|buildings?)/i);
  if (numMatch) return `${numMatch[1]} ${numMatch[2]}`;

  // 6. Short bold phrase (< 25 chars)
  const shortBoldMatch = text.match(/\*\*([^*]{1,25})\*\*/);
  if (shortBoldMatch) return shortBoldMatch[1];

  // 7. Any large number
  const bigNumMatch = text.match(/\b(\d{1,3}(?:,\d{3})+)\b/);
  if (bigNumMatch) return bigNumMatch[1];

  return null;
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

// Call NIM API for live queries
async function callNIM(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const baseUrl = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.NVIDIA_NIM_MODEL || 'nvidia/llama-3.1-nemotron-nano-8b-v1';

  if (!apiKey) {
    console.error('NVIDIA_NIM_API_KEY not set');
    return '';
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 512,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      console.error(`NIM error: ${response.status} ${response.statusText}`);
      return '';
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('NIM error:', error);
    return '';
  }
}


// Check if email is on the waitlist (signed up)
async function isWaitlistUser(email: string | null): Promise<boolean> {
  if (!email) return false;
  try {
    const { data } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .limit(1)
      .single();
    return !!data;
  } catch {
    return false;
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

// Helper to return an SSE stream with a single response
function sseResponse(responseObj: any): Response {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      send('response', responseObj);
      send('done', {});
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}

export async function POST(req: Request) {
  const { message, email } = await req.json();

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  // Check if this is a cached (pre-built) question - anyone can query
  const isCached = await isCachedQuestion(message);

  // For custom queries, require signup (waitlist) and feature flag
  if (!isCached) {
    const customQueriesEnabled = process.env.CUSTOM_QUERIES_ENABLED === 'true';

    if (!customQueriesEnabled) {
      return sseResponse({
        message: 'This question isn\'t in our pre-analyzed set yet. Try one of the suggested questions to explore real Austin permit data powered by NVIDIA Nemotron.',
        comingSoon: true,
        storyBlock: {
          id: `coming-soon-${Date.now()}`,
          headline: 'Try a suggested question',
          insight: 'We have 133 pre-analyzed questions covering solar, batteries, generators, EV chargers, construction trends, and more. Pick one from the suggestions!',
          whyStoryWorthy: 'waitlist',
          confidence: 'high',
        },
      });
    }

    // Check if user is on the waitlist (signed up)
    const onWaitlist = await isWaitlistUser(email);
    if (!onWaitlist) {
      return sseResponse({
        message: 'Sign up to unlock custom queries powered by NVIDIA Nemotron.',
        requiresAuth: true,
        storyBlock: {
          id: `auth-required-${Date.now()}`,
          headline: 'Sign up required',
          insight: 'Enter your email to unlock custom questions about Austin\'s energy infrastructure.',
          whyStoryWorthy: 'auth-gate',
          confidence: 'high',
        },
      });
    }
  }

  // Check cache FIRST — cached questions are pre-vetted, skip guardrails
  const cachedAnswer = await getCachedAnswer(message);
  if (cachedAnswer) {
    const stream = new ReadableStream({
      start(controller) {
        sendEvent(controller, 'status', { step: 'cached', message: 'Found answer...' });
        sendEvent(controller, 'response', cachedAnswer);
        sendEvent(controller, 'done', {});
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  }

  // Apply guardrails only to non-cached (custom) questions
  const { safe, cleaned, reason } = sanitizeInput(message);
  if (!safe) {
    return sseResponse({
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
            searching: 'Scanning energy permits across Austin...',
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
            searching: 'Searching Austin permit records...',
            thinking: 'Connecting the dots...'
          },
        };

        const msgs = engagingMessages[intent] || engagingMessages.general;
        sendEvent(controller, 'status', { step: 'analyzing', message: msgs.searching });

        let responseText = '';

        // Get analytics data (no SQL shown to user)
        const analyticsData = await searchAnalytics(message);

        // Build system prompt and user message for NIM
        let systemPrompt = '';
        let fallbackText = '';

        const groundingRules = `INSTRUCTIONS:
- Answer the question in 3-5 sentences using ONLY numbers from the data above.
- Your FIRST word must be a bold stat from the data (e.g., **X solar installations** or **Y generators**).
- NEVER start with "Sure", "Here's", "Based on", "It seems", or any preamble.
- Use specific ZIP codes and comparisons from the data provided.
- Be direct and authoritative like a news headline followed by context.`;

        const topicMap: Record<string, string> = {
          energy: 'Austin energy infrastructure',
          trends: 'Austin construction trends',
          clusters: 'Austin construction clusters',
          luxury: 'Austin luxury construction',
          general: 'Austin construction data',
        };

        if (intent === 'general') {
          const insights = await getKeyInsights();
          systemPrompt = `You are an Austin construction data analyst. Answer the user's question using ONLY the verified data below. Do NOT make up any numbers.\n\nVERIFIED DATA:\n${insights}\n\n${groundingRules}`;
          fallbackText = `I can help with Austin construction insights. Try asking about solar, generators, trends, or clusters.`;
        } else {
          const topic = topicMap[intent];
          systemPrompt = `You are a data analyst. Answer questions about ${topic} using ONLY the data provided below. Do NOT make up any numbers.\n\nVERIFIED DATA:\n${analyticsData}\n\n${groundingRules}`;
          fallbackText = `${topic}:\n\n${analyticsData}`;
        }

        sendEvent(controller, 'status', { step: 'processing', message: msgs.thinking });

        const llmResponse = await callNIM(systemPrompt, cleaned);
        responseText = llmResponse || fallbackText;

        sendEvent(controller, 'status', { step: 'complete', message: 'Done' });

        // Cache this response for future use
        const questionHash = hashQuestion(cleaned);

        // Build response object matching ChatResponse schema
        const plainText = responseText.replace(/\*\*/g, '').trim();
        const sentences = plainText.split(/(?<=[.!?])\s+/).filter(s => s.length > 10);
        const shortInsight = sentences.slice(0, 2).join(' ');

        // Short headline from intent
        const intentLabels: Record<string, string> = {
          energy: 'Energy Insight',
          trends: 'Trend Analysis',
          clusters: 'Cluster Pattern',
          luxury: 'Premium Segment',
          general: 'Austin Insight',
        };
        const headline = intentLabels[intent] || 'Austin Insight';

        // Extract a key stat from the response text for dataPoint
        const keyStat = extractKeyStat(responseText);
        const llmModel = process.env.NVIDIA_NIM_MODEL || 'nvidia/llama-3.1-nemotron-nano-8b-v1';

        // Trim message to 3 sentences max
        const msgSentences = responseText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
        const shortMessage = msgSentences.slice(0, 3).join(' ');

        const responseObject = {
          message: shortMessage || responseText.slice(0, 300),
          storyBlock: {
            id: `${intent}-${Date.now()}`,
            question: cleaned,
            headline,
            insight: shortInsight || plainText.slice(0, 200),
            dataPoint: keyStat ? { label: keyStat.includes('%') ? 'Change' : 'Key stat', value: keyStat.slice(0, 30) } : null,
            whyStoryWorthy: 'turning-point',
            evidence: [
              { stat: 'Analyzed from Austin permit records (2000-2026)', source: 'Austin Open Data via Supabase' },
              { stat: `Generated by ${llmModel}`, source: 'NVIDIA NIM API' },
            ],
            confidence: 'high',
          },
        };

        // Cache this response for future queries (fire and forget)
        // Try with model column first (post-migration), fall back to legacy upsert
        supabase.from('cached_answers').upsert({
          question: cleaned,
          question_hash: questionHash,
          answer: responseObject,
          storyline: null,
          model: llmModel,
          model_metadata: {
            generated_at: new Date().toISOString(),
            temperature: 0.7,
            source: 'live-query',
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'question_hash,model' }).then(({ error }) => {
          if (error) {
            // Pre-migration fallback: upsert without model columns
            supabase.from('cached_answers').upsert({
              question: cleaned,
              question_hash: questionHash,
              answer: responseObject,
              storyline: null,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'question_hash' });
          }
        })

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
