import { openai } from '@ai-sdk/openai';
import { streamText, generateObject } from 'ai';
import { ChatResponseSchema } from '@/lib/chat-schema';
import { SYSTEM_PROMPT, DATA_QUERY_PROMPT } from '@/lib/chat-context';
import { getMcpTools } from '@/lib/mcp-client';
import { MODE_CONFIG, GUARDRAILS, type Mode } from '@/lib/modes';

export const maxDuration = 60;

// Timeout helper
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

// Helper to send SSE events
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export async function POST(req: Request) {
  const { message, mode = 'scout' } = await req.json();

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  // Get mode-specific prompt modifier
  const modeConfig = MODE_CONFIG[mode as Mode] || MODE_CONFIG.scout;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Connect to MCP (with 5s timeout)
        sendEvent(controller, 'status', { step: 'connecting', message: 'Connecting to database...' });

        const mcpTools = await withTimeout(getMcpTools(), 5000, {});
        const hasTools = Object.keys(mcpTools).length > 0;
        let dataContext = '';

        if (!hasTools) {
          console.log('MCP tools not available or timed out, proceeding without database');
        }

        if (hasTools) {
          // Step 2: Query database (with retries for robustness)
          sendEvent(controller, 'status', { step: 'querying', message: 'Running SQL query...' });

          const dataResult = await streamText({
            model: openai('gpt-5.2'),
            system: DATA_QUERY_PROMPT,
            prompt: `User question: "${message}"\n\nWrite and execute SQL queries to answer this. Use the postgres-query tool. If a query fails or returns no results, try alternative approaches (different columns, simpler aggregations, etc). Always return useful data.`,
            tools: mcpTools,
            toolChoice: 'required',
            onChunk: ({ chunk }) => {
              if (chunk.type === 'tool-call') {
                sendEvent(controller, 'tool-call', {
                  name: chunk.toolName,
                  input: chunk.input
                });
              }
            },
          });

          // Wait for completion and get results
          const result = await dataResult;
          const toolResults = await result.toolResults;
          const resultArray = toolResults ? Array.from(toolResults) : [];

          if (resultArray.length > 0) {
            for (const r of resultArray) {
              sendEvent(controller, 'tool-result', {
                name: r.toolName,
                result: r
              });
            }
            dataContext = resultArray.map((r) =>
              `Tool ${r.toolName}: ${JSON.stringify(r)}`
            ).join('\n');
          } else {
            dataContext = await result.text || '';
          }

          sendEvent(controller, 'status', { step: 'analyzing', message: 'Analyzing results...' });
        }

        // Step 3: Generate structured response with mode context
        const modePrompt = `## Current Mode: ${modeConfig.label}\n${modeConfig.promptModifier}`;
        const systemWithMode = `${SYSTEM_PROMPT}\n\n${modePrompt}\n\n${GUARDRAILS}`;
        const systemWithData = hasTools && dataContext
          ? `${systemWithMode}\n\n## Live Data from Database:\n${dataContext}`
          : systemWithMode;

        const response = await generateObject({
          model: openai('gpt-5.2'),
          schema: ChatResponseSchema,
          system: systemWithData,
          prompt: message,
        });

        // Log the response for debugging
        console.log('Chat response:', JSON.stringify(response.object, null, 2));

        // Send final response
        sendEvent(controller, 'response', response.object);
        sendEvent(controller, 'done', {});

      } catch (error) {
        console.error('Chat API error:', error);
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
