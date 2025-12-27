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
    const modelName = process.env.VLLM_MODEL_NAME || 'llama3.2:3b';

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: `Given these Austin construction insights: ${storyContext}

Generate 3 follow-up questions a user might ask to dig deeper. Questions should be:
- Short (5-8 words)
- Specific and actionable
- Related but exploring new angles

Output format (just the questions, one per line):`,
        stream: false,
        keep_alive: '30m',  // Keep model in GPU memory
        options: {
          temperature: 0.8,
          num_predict: 100,
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
