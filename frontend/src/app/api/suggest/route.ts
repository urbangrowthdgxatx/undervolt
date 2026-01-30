export async function POST(req: Request) {
  try {
    const { blocks } = await req.json();

    if (!blocks || blocks.length === 0) {
      // Default suggestions for empty story
      return Response.json({
        questions: [
          "What's growing fastest in Austin?",
          "Show me energy infrastructure data",
          "Tell me about ZIP 78758",
        ]
      });
    }

    // Generate contextual questions based on existing story
    const storyContext = blocks.map((b: any) => b.headline).join(', ');

    const ollamaUrl = process.env.VLLM_BASE_URL?.replace('/v1', '') || 'http://localhost:11434';
    const modelName = process.env.VLLM_MODEL_NAME || 'nemotron-mini';

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: `Based on: ${storyContext}

Generate 3 short follow-up questions (5-7 words each):`,
        stream: false,
        keep_alive: '30m',  // Keep model in GPU memory
        options: {
          temperature: 0.8,
          num_predict: 60,  // Reduced for speed (3 questions)
          num_ctx: 256,     // Minimal context
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const questions = data.response
      .trim()
      .split('\n')
      .filter((q: string) => q.trim().length > 0)
      .map((q: string) => q.replace(/^[\d.-]\s*/, '').trim()) // Remove numbering
      .slice(0, 3);

    return Response.json({ questions });

  } catch (error) {
    console.error('Suggestion error:', error);
    // Fallback to static suggestions
    return Response.json({
      questions: [
        "What's the biggest surprise?",
        "Which ZIP codes stand out?",
        "How has this changed recently?",
      ]
    });
  }
}
