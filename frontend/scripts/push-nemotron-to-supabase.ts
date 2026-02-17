/**
 * Push Nemotron-generated answers from eval/results/nemotron-vs-current.json
 * into the cached_answers table with model versioning metadata.
 *
 * Prerequisites:
 *   1. Run the SQL migration: scripts/migrations/001-add-model-versioning.sql
 *   2. Have nemotron-vs-current.json generated (133 answers)
 *
 * Usage:
 *   npx tsx scripts/push-nemotron-to-supabase.ts
 */
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const MODEL = "nvidia/llama-3.1-nemotron-nano-8b-v1";

function hashQuestion(q: string): string {
  return crypto.createHash("md5").update(q.toLowerCase().trim()).digest("hex");
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

  // 4. Number with unit from bold text (e.g., **2,097** units, **26,075**)
  const boldNumMatch = text.match(/\*\*([\d,]+(?:\.\d+)?)\*\*\s*(installations?|permits?|systems?|chargers?|generators?|units?|homes?|projects?|kW|MW)?/i);
  if (boldNumMatch) return boldNumMatch[2] ? `${boldNumMatch[1]} ${boldNumMatch[2]}` : boldNumMatch[1];

  // 5. Large number with unit in plain text
  const numMatch = text.match(/([\d,]+(?:\.\d+)?)\s+(installations?|permits?|systems?|chargers?|generators?|units?|homes?|projects?|buildings?)/i);
  if (numMatch) return `${numMatch[1]} ${numMatch[2]}`;

  // 6. Any bold short phrase (< 25 chars, likely a stat not a sentence)
  const shortBoldMatch = text.match(/\*\*([^*]{1,25})\*\*/);
  if (shortBoldMatch) return shortBoldMatch[1];

  // 7. Any number with commas over 1,000
  const bigNumMatch = text.match(/\b(\d{1,3}(?:,\d{3})+)\b/);
  if (bigNumMatch) return bigNumMatch[1];

  return null;
}

// Build a short punchy headline (3-6 words) from question context + answer direction
function buildHeadline(question: string, plainText: string): string {
  const qLower = question.toLowerCase();
  const lower = plainText.toLowerCase();

  // Extract subject from question
  let subject = "";
  if (qLower.includes("solar")) subject = "Solar";
  else if (qLower.includes("generator")) subject = "Generators";
  else if (qLower.includes("battery") || qLower.includes("batteries")) subject = "Battery Storage";
  else if (qLower.includes("ev") || qLower.includes("charger")) subject = "EV Chargers";
  else if (qLower.includes("pool")) subject = "Pools";
  else if (qLower.includes("adu")) subject = "ADUs";
  else if (qLower.includes("demolition")) subject = "Demolitions";
  else if (qLower.includes("remodel")) subject = "Remodels";
  else if (qLower.includes("hvac")) subject = "HVAC";
  else if (qLower.includes("energy") || qLower.includes("electrif")) subject = "Electrification";
  else if (qLower.includes("construction") || qLower.includes("permit")) subject = "Construction";
  else if (qLower.includes("district")) subject = "Districts";
  else if (qLower.includes("zip")) subject = "ZIP Codes";
  else if (qLower.includes("resilience") || qLower.includes("resilient")) subject = "Resilience";
  else if (qLower.includes("equity") || qLower.includes("inequit")) subject = "Equity";

  // Extract context from question (what angle)
  let context = "";
  if (qLower.includes("where") || qLower.includes("which zip") || qLower.includes("which neighborhood")) context = "hotspots";
  else if (qLower.includes("why")) context = "drivers";
  else if (qLower.includes("how much") || qLower.includes("how many") || qLower.includes("total")) context = "scale";
  else if (qLower.includes("compar") || qLower.includes("vs") || qLower.includes("versus")) context = "comparison";
  else if (qLower.includes("trend") || qLower.includes("over time") || qLower.includes("since")) context = "trajectory";
  else if (qLower.includes("peak") || qLower.includes("decline")) context = "turning point";
  else if (qLower.includes("average") || qLower.includes("typical")) context = "benchmarks";
  else if (qLower.includes("lead") || qLower.includes("top") || qLower.includes("most")) context = "leaders";
  else if (qLower.includes("gap") || qLower.includes("disparity")) context = "divide";
  else if (qLower.includes("cost") || qLower.includes("afford")) context = "economics";
  else if (qLower.includes("future") || qLower.includes("predict") || qLower.includes("next")) context = "outlook";

  // Build headline from subject + context
  const contextHeadlines: Record<string, string> = {
    hotspots: "Hotspots",
    drivers: "Why It Matters",
    scale: "By the Numbers",
    comparison: "Head to Head",
    trajectory: "Over Time",
    "turning point": "Turning Point",
    benchmarks: "Benchmarks",
    leaders: "Leaders",
    divide: "The Divide",
    economics: "Economics",
    outlook: "Outlook",
  };

  if (subject && context) return `${subject}: ${contextHeadlines[context] || context}`;
  if (subject) return `${subject} Overview`;

  // Fallback: first 4-5 words of question
  const words = question.replace(/[?]/g, "").split(/\s+/).slice(0, 5).join(" ");
  return words.length > 40 ? words.slice(0, 37) + "..." : words;
}

// Extract a contextual label for the data point (not generic "Key finding")
function extractStatLabel(text: string, stat: string | null): string {
  if (!stat) return "Key stat";
  const lower = text.toLowerCase();
  if (stat.includes("%")) return "Change";
  if (stat.includes(":")) return "Ratio";
  if (/\d+x/i.test(stat)) return "Multiplier";
  if (lower.includes("peak") || lower.includes("highest")) return "Peak";
  if (lower.includes("total")) return "Total";
  if (lower.includes("average") || lower.includes("avg")) return "Average";
  if (lower.includes("per ")) return "Rate";
  // Extract unit from stat itself
  const unitMatch = stat.match(/(installations?|permits?|chargers?|generators?|systems?|units?)/i);
  if (unitMatch) return unitMatch[1].charAt(0).toUpperCase() + unitMatch[1].slice(1).toLowerCase();
  return "Key stat";
}

// Detect why an insight is story-worthy based on content
function detectStoryReason(question: string, answer: string): string {
  const combined = (question + " " + answer).toLowerCase();
  if (combined.includes("equity") || combined.includes("inequit") || combined.includes("income") || combined.includes("afford")) return "equity-gap";
  if (combined.includes("freeze") || combined.includes("uri") || combined.includes("storm") || combined.includes("winter")) return "post-freeze-shift";
  if (combined.includes("district") && (combined.includes("compar") || combined.includes("vs") || combined.includes("gap"))) return "district-disparity";
  if (combined.includes("paradox") || combined.includes("contradiction") || combined.includes("despite") || combined.includes("yet ")) return "paradox";
  if (combined.includes("outlier") || combined.includes("unusual") || combined.includes("anomal")) return "outlier";
  return "turning-point";
}

async function main() {
  const resultsPath = path.join(__dirname, "..", "eval", "results", "nemotron-vs-current.json");

  if (!fs.existsSync(resultsPath)) {
    console.error("Results file not found:", resultsPath);
    console.error("Run generate-nemotron-answers.py first.");
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
  console.log(`Loaded ${results.length} Nemotron answers\n`);

  let success = 0;
  let errors = 0;

  for (const row of results) {
    const question = row.question;
    const answer = row.nemotron_answer;
    const hash = hashQuestion(question);

    if (answer.startsWith("ERROR")) {
      console.log(`SKIP (error): ${question.slice(0, 60)}`);
      errors++;
      continue;
    }

    // Strip markdown for headline extraction
    const plainText = answer.replace(/\*\*/g, "").trim();

    // Build a short, punchy headline (3-6 words)
    // Strategy: extract the core subject from the question and pair with key direction
    const headline = buildHeadline(question, plainText);

    // Extract key stat and a contextual label
    const keyStat = extractKeyStat(answer);
    const statLabel = extractStatLabel(answer, keyStat);

    // Split into sentences for concise card + message text
    const sentences = plainText.split(/(?<=[.!?])\s+/).filter((s: string) => s.length > 10);
    const shortInsight = sentences.slice(0, 2).join(" ");
    // Message: keep markdown bold, but only 2-3 sentences
    const msgSentences = answer.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 10);
    const shortMessage = msgSentences.slice(0, 3).join(" ");

    const responseObject = {
      message: shortMessage || answer.slice(0, 300),
      storyBlock: {
        id: `nemotron-${hash.slice(0, 8)}-${Date.now()}`,
        question,
        headline,
        insight: shortInsight || plainText.slice(0, 200),
        dataPoint: keyStat ? { label: statLabel, value: keyStat.slice(0, 30) } : null,
        whyStoryWorthy: detectStoryReason(question, answer),
        evidence: [
          { stat: "Analyzed from 2.34M Austin permits (2000-2026)", source: "Austin Open Data via Supabase" },
          { stat: `Generated by ${MODEL}`, source: "NVIDIA NIM API" },
        ],
        confidence: "high",
      },
    };

    const { error } = await supabase.from("cached_answers").upsert(
      {
        question,
        question_hash: hash,
        answer: responseObject,
        storyline: row.storyline || null,
        model: MODEL,
        model_metadata: {
          generated_at: row.generated_at,
          temperature: 0.6,
          max_tokens: 512,
          source: "nim-api-batch",
          category: row.category,
          eval_file: "nemotron-vs-current.json",
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "question_hash,model" }
    );

    if (error) {
      console.error(`FAIL: ${question.slice(0, 60)} — ${error.message}`);
      errors++;
    } else {
      const dp = keyStat || "(no stat)";
      console.log(`OK [${dp}]: ${question.slice(0, 60)}`);
      success++;
    }
  }

  console.log(`\nDone! Success: ${success} | Errors: ${errors}`);
}

main().catch(console.error);
