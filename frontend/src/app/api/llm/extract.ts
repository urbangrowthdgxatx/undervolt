/**
 * LLM Extraction API Endpoint
 * 
 * Extracts energy infrastructure features from permit descriptions
 * Proxies requests to the Python FastAPI backend
 * 
 * POST /api/llm/extract
 * Body: { descriptions: string[], backend?: string, model?: string }
 * Returns: { features: object[] }
 */

import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { descriptions, backend = "ollama", model = "neural-chat" } = body;

    if (!descriptions || !Array.isArray(descriptions)) {
      return NextResponse.json(
        { error: "descriptions must be an array of strings" },
        { status: 400 }
      );
    }

    if (descriptions.length === 0) {
      return NextResponse.json({ features: [] });
    }

    // Try calling Python backend
    try {
      const pythonResponse = await fetch(`${PYTHON_API_URL}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptions, backend, model }),
      });

      if (pythonResponse.ok) {
        const data = await pythonResponse.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.log("Python API not available, falling back to mock extraction");
    }

    // Fallback: Mock extraction if Python backend not running
    const mockFeatures = descriptions.map((desc: string) => {
      const lower = desc.toLowerCase();
      return {
        is_solar: lower.includes("solar"),
        is_battery: lower.includes("battery") || lower.includes("storage"),
        is_generator: lower.includes("generator") || lower.includes("backup"),
        is_ev_charger: lower.includes("ev") || lower.includes("charger"),
        is_adu: lower.includes("adu") || lower.includes("dwelling"),
        is_residential: lower.includes("residential") || lower.includes("home"),
        is_commercial: lower.includes("commercial") || lower.includes("office"),
        is_new_construction: lower.includes("new") || lower.includes("construction"),
        is_remodel: lower.includes("remodel") || lower.includes("renovation"),
        has_hvac: lower.includes("hvac") || lower.includes("air"),
        has_electrical: lower.includes("electrical") || lower.includes("electric"),
        has_plumbing: lower.includes("plumbing") || lower.includes("plumb"),
      };
    });

    return NextResponse.json({
      features: mockFeatures,
      backend: "mock",
      fallback: true,
    });
  } catch (error) {
    console.error("LLM extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract features" },
      { status: 500 }
    );
  }
}
