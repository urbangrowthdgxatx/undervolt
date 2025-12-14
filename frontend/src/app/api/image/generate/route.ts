import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, style } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Prompt required" }, { status: 400 });
    }

    if (!process.env.GOOGLE_AI_KEY) {
      return Response.json({ error: "GOOGLE_AI_KEY not configured" }, { status: 500 });
    }

    // Build the full prompt with style guidance
    let fullPrompt = prompt;
    if (style === "editorial") {
      fullPrompt = `Editorial illustration style, minimalist, sophisticated: ${prompt}. Clean lines, muted colors, professional journalism aesthetic.`;
    } else if (style === "conceptual") {
      fullPrompt = `Conceptual art, abstract representation: ${prompt}. Symbolic, thought-provoking, minimal detail.`;
    } else if (style === "diagram") {
      fullPrompt = `Clean infographic style diagram: ${prompt}. Simple shapes, clear visual hierarchy, data visualization aesthetic.`;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: fullPrompt,
    });

    // Extract image from response
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return Response.json({ error: "No response from model" }, { status: 500 });
    }

    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || "image/png";
        const imageUrl = `data:${mimeType};base64,${imageData}`;
        return Response.json({ imageUrl });
      }
    }

    return Response.json({ error: "No image in response" }, { status: 500 });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
