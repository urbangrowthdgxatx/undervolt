import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ChatResponseSchema } from '@/lib/chat-schema';
import { SYSTEM_PROMPT } from '@/lib/chat-context';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: ChatResponseSchema,
      system: SYSTEM_PROMPT,
      prompt: message,
      temperature: 0.3,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
