import { openai } from '@ai-sdk/openai';
import { streamText, generateObject } from 'ai';
import { ChatResponseSchema } from '@/lib/chat-schema';
import { SYSTEM_PROMPT, DATA_QUERY_PROMPT } from '@/lib/chat-context';
import { getMcpTools } from '@/lib/mcp-client';

export const maxDuration = 60;

// Helper to send SSE events
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export async function POST(req: Request) {
  const { message } = await req.json();

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Connect to MCP
        sendEvent(controller, 'status', { step: 'connecting', message: 'Connecting to database...' });

        const mcpTools = await getMcpTools();
        const hasTools = Object.keys(mcpTools).length > 0;
        let dataContext = '';

        if (hasTools) {
          // Step 2: Query database
          sendEvent(controller, 'status', { step: 'querying', message: 'Running SQL query...' });

          const dataResult = await streamText({
            model: openai('gpt-5.2'),
            system: DATA_QUERY_PROMPT,
            prompt: `User question: "${message}"\n\nWrite and execute a SQL query to answer this. Use the postgres-query tool.`,
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

        // Step 3: Generate structured response
        const systemWithData = hasTools && dataContext
          ? `${SYSTEM_PROMPT}\n\n## Live Data from Database:\n${dataContext}`
          : SYSTEM_PROMPT;

        const response = await generateObject({
          model: openai('gpt-5.2'),
          schema: ChatResponseSchema,
          system: systemWithData,
          prompt: message,
        });

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
