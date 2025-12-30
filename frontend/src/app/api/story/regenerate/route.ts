export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { blocks } = await req.json();

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return Response.json(blocks || []);
    }

    // If only one block, no need to regenerate connections
    if (blocks.length === 1) {
      return Response.json(blocks);
    }

    // For now, just return blocks as-is
    // Connection regeneration is optional for local LLM
    // Can be enhanced later if needed
    return Response.json(blocks);
  } catch (error) {
    console.error('Story regeneration error:', error);
    // Return original blocks if regeneration fails
    const { blocks } = await req.json().catch(() => ({ blocks: [] }));
    return Response.json(blocks);
  }
}
