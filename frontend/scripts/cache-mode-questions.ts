import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { CATEGORY_QUESTIONS, CATEGORY_CONFIG, type Category } from "../src/lib/modes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const llmBase = process.env.VLLM_BASE_URL || "http://localhost:4000/v1";
const modelName = process.env.VLLM_CACHE_MODEL_NAME || process.env.VLLM_MODEL_NAME || "nemotron-mini";
const llmKey = process.env.LLM_API_KEY;

function hashQuestion(q: string): string {
  return crypto.createHash("md5").update(q.toLowerCase().trim()).digest("hex");
}

// Extract a key statistic from answer text
// Priority: bold stat > percentage > ratio > multiplier > large number
function extractKeyStat(text: string): string | null {
  // 1. Bold markdown stat (if Nemotron complied)
  const boldMatch = text.match(/\*\*([^*]+)\*\*/);
  if (boldMatch) return boldMatch[1].slice(0, 40);

  // 2. Percentage with context (e.g., "+340%", "grew 547%")
  const pctMatch = text.match(/(\+?\d[\d,]*\.?\d*%)/);
  if (pctMatch) return pctMatch[1];

  // 3. Ratio (e.g., "22:1", "5:1")
  const ratioMatch = text.match(/(\d+:\d+)/);
  if (ratioMatch) return ratioMatch[1];

  // 4. Multiplier (e.g., "5x more")
  const multMatch = text.match(/(\d+x\s+(?:more|less|higher|lower|greater))/i);
  if (multMatch) return multMatch[1];

  // 5. Large number with commas (e.g., "7,305 installations")
  const numMatch = text.match(/([\d,]+(?:\.\d+)?)\s+(installations?|permits?|systems?|chargers?|generators?|units?|homes?|projects?|buildings?)/i);
  if (numMatch) return `${numMatch[1]} ${numMatch[2]}`;

  // 6. Any number with commas over 1,000
  const bigNumMatch = text.match(/\b(\d{1,3}(?:,\d{3})+)\b/);
  if (bigNumMatch) return bigNumMatch[1];

  return null;
}

// Raw analytics data loaded once from Supabase
interface AnalyticsData {
  clusters: any[];
  energyZips: any[];
  totals: { solar: number; battery: number; evCharger: number; generator: number; hvac: number; panelUpgrade: number };
  topZips: any[];
}

async function loadAnalyticsData(): Promise<AnalyticsData> {
  const [clustersRes, energyRes] = await Promise.all([
    supabase.from("clusters").select("*").order("id"),
    supabase.from("energy_stats_by_zip").select("*").order("total_energy_permits", { ascending: false }),
  ]);

  const clusters = clustersRes.data || [];
  const energyZips = energyRes.data || [];

  const totals = energyZips.reduce(
    (acc: any, z: any) => {
      acc.solar += z.solar || 0;
      acc.battery += z.battery || 0;
      acc.evCharger += z.ev_charger || 0;
      acc.generator += z.generator || 0;
      acc.hvac += z.hvac || 0;
      acc.panelUpgrade += z.panel_upgrade || 0;
      return acc;
    },
    { solar: 0, battery: 0, evCharger: 0, generator: 0, hvac: 0, panelUpgrade: 0 }
  );

  return { clusters, energyZips, totals, topZips: energyZips.slice(0, 10) };
}

// Build topic-specific context so Nemotron focuses on the right data
function buildCategoryContext(category: Category, data: AnalyticsData): string {
  const { clusters, totals, topZips, energyZips } = data;
  const solarBatteryRatio = Math.round(totals.solar / Math.max(totals.battery, 1));

  // Category-specific data blocks — enriched with verified external data
  const categoryContexts: Record<Category, string> = {
    solar: `TOPIC: Solar Energy in Austin
- Total solar installations: ${totals.solar.toLocaleString()}
- Solar trend (peaked 2023): 2021: 1,834 → 2022: 1,956 → 2023: 2,097 → 2024: 1,567 → 2025: 1,139
- Solar-to-battery ratio: ${solarBatteryRatio}:1 (only 1 battery for every ${solarBatteryRatio} solar installs)
- Top solar ZIPs: ${topZips.slice(0, 5).map((z: any) => `${z.zip_code} (${z.solar} solar)`).join(", ")}
- Average residential system size: 5kW to 12kW
- Austin Energy is the #1 municipal utility for solar per capita in the US (per SEIA)
- Austin Energy added a record 18.8 MW of rooftop solar in 2025 (749 projects)
IMPORTANT: Only discuss solar topics. Do NOT reference generator surge stats.`,

    battery: `TOPIC: Battery Storage in Austin
- Total battery systems: ${totals.battery.toLocaleString()}
- Solar-to-battery ratio: ${solarBatteryRatio}:1 (only 1 battery for every ${solarBatteryRatio} solar installs)
- Battery growth: rapid increase since 2020, driven by grid reliability concerns
- Top battery ZIPs: ${topZips.slice(0, 5).map((z: any) => `${z.zip_code} (${z.battery} batteries)`).join(", ")}
- Battery adoption correlates with income (0.78 wealth correlation)
- Austin Energy signed a 100 MW utility-scale battery deal with Jupiter Power
- Austin Energy is launching a residential battery incentive program
- Typical home battery system (Tesla Powerwall): $10,000–$15,000 installed
IMPORTANT: Only discuss battery topics. Do NOT reference generator surge stats.`,

    generators: `TOPIC: Backup Generators in Austin
- Total generators: ${totals.generator.toLocaleString()}
- Post-freeze surge: 312 permits in 2020 → 1,373 in 2021 (after Winter Storm Uri)
- Westlake vs East Austin: 5:1 ratio in backup power installations
- Generator demand stayed elevated through 2023, moderating in 2024
- Top generator ZIPs: ${topZips.slice(0, 5).map((z: any) => `${z.zip_code} (${z.generator} generators)`).join(", ")}
- Typical whole-home generator cost in Austin: $11,000–$13,000 (per KXAN reporting)
- Generator dealers were backlogged for months after Uri
IMPORTANT: Only discuss generator topics.`,

    ev: `TOPIC: EV Chargers in Austin
- Total EV charger permits: ${totals.evCharger.toLocaleString()}
- EV charger growth: accelerating since 2020 with EV adoption
- Top EV ZIPs: ${topZips.slice(0, 5).map((z: any) => `${z.zip_code} (${z.ev_charger} chargers)`).join(", ")}
- East-west divide: West Austin has significantly more EV infrastructure
- EV deserts exist in eastern and southern Austin
- Travis County has ~25,148 registered EVs (per Texas Standard, 2024)
- Austin received a $15M federal grant for 200+ stations in underserved areas
- Austin Energy operates ~1,500 L2 public charging ports
IMPORTANT: Only discuss EV topics. Do NOT reference generator surge stats.`,

    resilience: `TOPIC: Grid Resilience and Backup Power
- Total generators: ${totals.generator.toLocaleString()} | Batteries: ${totals.battery.toLocaleString()} | Panel upgrades: ${totals.panelUpgrade.toLocaleString()}
- Winter Storm Uri (Feb 2021) triggered a surge in backup power permits
- Westlake vs East Austin backup power: 5:1 ratio
- Wealth correlation with backup power: 0.78
- Most resilient ZIPs: ${topZips.slice(0, 3).map((z: any) => `${z.zip_code} (${z.generator} gen, ${z.battery} battery)`).join(", ")}
- Most vulnerable: eastern Austin ZIPs with lowest generator + battery counts
- Austin Energy launched $735M Energy System Resiliency Plan (ESRP) post-Uri
- ESRP includes $60M in FY2026 for hardening 10 priority circuits
IMPORTANT: Only discuss resilience topics.`,

    growth: `TOPIC: Construction Growth Trends (2000-2026)
- Scale: 2.34 million permits analyzed across Austin
- Permit categories: ${clusters.map((c: any) => `${c.name}: ${c.count?.toLocaleString()} (${c.percentage?.toFixed(1)}%)`).join(", ")}
- COVID impact: construction dipped in 2020, rebounded strongly 2021-2023
- Fastest growing: solar (+300% since 2015), demolition (+547%), ADUs (new category)
- 2024-2026: solar declining from peak, construction normalizing
- Austin metro ranked #6 nationally in building permits (32,294 units authorized in 2024)
- Austin's 2024 permits were +42.6% above the 2000-2023 long-term average
IMPORTANT: Only discuss construction growth topics. Do NOT reference generator surge stats.`,

    equity: `TOPIC: Energy Equity and Income Disparities
- Wealth correlation: 0.78 between median income and backup power installations
- Westlake (wealthy) vs East Austin (lower income): 5:1 ratio in backup power
- Solar access gap: wealthy ZIPs have 3-4x more solar per capita
- Generator divide: affluent neighborhoods installed generators after Uri freeze, lower-income areas didn't
- Total energy infrastructure: Solar ${totals.solar.toLocaleString()}, Generators ${totals.generator.toLocaleString()}, Batteries ${totals.battery.toLocaleString()}
- Low-income Texans spend ~10% of income on energy vs ~1% for wealthy households (energy burden)
- Top income ZIPs for energy infrastructure: ${topZips.slice(0, 3).map((z: any) => z.zip_code).join(", ")}
IMPORTANT: Only discuss equity topics. Do NOT reference generator surge stats.`,

    districts: `TOPIC: Council District Comparisons
- 10 council districts in Austin with varying infrastructure investment
- District 10 (Westlake/NW Hills): 2,151 generators, highest backup power per capita
- District 8 (SW Austin): 1,423 generators, moderate and growing
- District 6 (NW Austin): 987 generators
- District 4 (E Central): 412 generators
- District 1 (East Austin): 175 generators, lower infrastructure investment, higher vulnerability
- Energy permits vary up to 12× between District 10 and District 1
- Total permits analyzed: 2.34 million across all districts
- Solar installations: D10 and D8 lead, D1 and D3 trail
IMPORTANT: Only discuss district comparison topics. Do NOT reference generator surge stats.`,

    pools: `TOPIC: Pools and Luxury Construction
- Pool permits concentrated in western and northwestern Austin ZIPs
- Pool construction correlates strongly with median income
- Luxury renovation spending highest in 78746 (Westlake), 78703, 78731
- Pool permit trends: steady growth 2010-2019, dip in 2020, recovery 2021-2023
- Austin issued approximately 1,215 pool permits in 2024
- Permit categories: ${clusters.filter((c: any) => c.name?.toLowerCase().includes("pool") || c.name?.toLowerCase().includes("renovation") || c.name?.toLowerCase().includes("remodel")).map((c: any) => `${c.name}: ${c.count?.toLocaleString()}`).join(", ") || "See full categories below"}
IMPORTANT: Only discuss pool and luxury construction topics. Do NOT reference generator surge stats.`,

    adu: `TOPIC: Accessory Dwelling Units (ADUs)
- ADU permits: growing rapidly since Austin zoning changes (HOME Initiative 2023)
- ADU growth rate: significant increase from 2018 to 2026
- Top ADU ZIPs: central Austin neighborhoods (78704, 78745, 78702)
- Policy driver: Austin's HOME Initiative eased zoning restrictions
- ADUs represent a densification trend in established neighborhoods
- HOME Initiative Phase 1: 264 applications submitted (per KXAN)
- HOME Initiative Phase 2 (3+ units): only 4 applications so far — underperforming expectations
- ADU permits up +86% since HOME Initiative passed
- Permit categories: ${clusters.filter((c: any) => c.name?.toLowerCase().includes("adu") || c.name?.toLowerCase().includes("accessory")).map((c: any) => `${c.name}: ${c.count?.toLocaleString()}`).join(", ") || "ADU permits tracked in residential category"}
IMPORTANT: Only discuss ADU topics. Do NOT reference generator surge stats.`,

    demolition: `TOPIC: Demolition and Teardowns
- Demolition growth: +547% increase since 2015
- Demolition concentrated in central and east Austin (gentrification)
- Top teardown ZIPs: 78702, 78704, 78722 (East Austin/South Austin)
- Pattern: old homes being torn down and replaced with larger/newer construction
- Demolition accelerated 2018-2023, correlates with Austin real estate boom
- Central Austin demolitions increased +40% over the last 2 years
- HOME Initiative (Dec 2023) allowed more density, may be accelerating teardowns
- Permit categories: ${clusters.filter((c: any) => c.name?.toLowerCase().includes("demo")).map((c: any) => `${c.name}: ${c.count?.toLocaleString()}`).join(", ") || "Demolition permits tracked separately"}
IMPORTANT: Only discuss demolition topics. Do NOT reference generator surge stats.`,

    eastwest: `TOPIC: East Austin vs West Austin Divide
- West Austin: higher income, more solar (3-4x), more generators (5:1 ratio), more pools
- East Austin: lower income, more demolition/teardowns, gentrification signals
- Solar: West Austin ZIPs dominate top installations
- Generators: Westlake 5:1 ratio vs East Austin in backup power
- Construction: East Austin seeing demolition + new construction (gentrification)
- Energy equity gap widens: 0.78 correlation between income and infrastructure
- Total energy: Solar ${totals.solar.toLocaleString()}, Generators ${totals.generator.toLocaleString()}, EV ${totals.evCharger.toLocaleString()}
- 78746 (Westlake) median home value: ~$1.63M; 78702 (East Austin): ~$730K (Zillow, 2025)
IMPORTANT: Only discuss east-west divide topics.`,
  };

  return categoryContexts[category];
}

async function callLLM(prompt: string): Promise<string> {
  const response = await fetch(`${llmBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(llmKey && { "Authorization": `Bearer ${llmKey}` }),
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function cacheQuestion(question: string, category: Category, categoryContext: string) {
  const hash = hashQuestion(question);

  console.log("Gen:", question);

  const topicLabel = CATEGORY_CONFIG[category].label;

  // Build a focused prompt with only topic-relevant data
  const prompt = `You are a data analyst for Austin, Texas. Answer this ${topicLabel} question using ONLY the data below. Never invent numbers.

Question: "${question}"

${categoryContext}

RULES:
1. Start with the key stat in bold: **stat here** (e.g., **+340% surge**, **${topicLabel}-specific number**)
2. The bold stat MUST be about ${topicLabel.toLowerCase()}, not about other topics.
3. Give 2-3 sentences using exact numbers from the data above.
4. Be conversational and direct. No preamble.
Answer:`;

  const answer = await callLLM(prompt);

  if (!answer) {
    console.log("FAIL:", question);
    return;
  }

  // Build headline from first sentence
  const cleanedResponse = answer
    .replace(/^(here is |here are |here's |this is |the following |based on |according to )/i, "")
    .replace(/^\*\*/g, "")
    .trim();
  const firstSentence = cleanedResponse.split(/[.!?\n]/)[0].replace(/\*\*/g, "").trim();
  const headline =
    firstSentence.length > 50 ? firstSentence.substring(0, 47) + "..." : firstSentence || "Austin Insight";

  // Extract a key stat from the answer text for dataPoint
  const keyStat = extractKeyStat(answer);

  const responseObject = {
    message: answer,
    storyBlock: {
      id: `mode-${Date.now()}`,
      headline,
      insight: answer,
      dataPoint: keyStat ? { label: "Key finding", value: keyStat.slice(0, 30) } : null,
      whyStoryWorthy: "turning-point",
      evidence: [
        { stat: "Analyzed from 2.34M Austin permits (2019-2024)", source: "Austin Open Data via Supabase" },
        { stat: "Generated by NVIDIA Nemotron on Jetson AGX Orin", source: "Local edge inference" },
      ],
      confidence: "high",
    },
  };

  const { error } = await supabase.from("cached_answers").upsert(
    {
      question,
      question_hash: hash,
      answer: responseObject,
      storyline: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "question_hash" }
  );

  if (error) {
    console.error("DB Error:", question, error.message);
    return;
  }

  const dp = keyStat || "(none)";
  console.log(`OK [${dp}]: ${question}`);
}

async function main() {
  console.log("Loading analytics data from Supabase...");
  const data = await loadAnalyticsData();
  console.log("Analytics data loaded.\n");

  const categories = Object.keys(CATEGORY_QUESTIONS) as Category[];
  const totalQuestions = categories.reduce((sum, cat) => sum + CATEGORY_QUESTIONS[cat].length, 0);

  console.log(`Caching ${totalQuestions} questions across ${categories.length} categories via Ollama (${modelName})...\n`);

  let cached = 0;
  let failed = 0;

  for (const category of categories) {
    const questions = CATEGORY_QUESTIONS[category];
    const context = buildCategoryContext(category, data);
    console.log(`\n--- ${CATEGORY_CONFIG[category].label} (${questions.length} questions) ---`);

    for (const q of questions) {
      try {
        await cacheQuestion(q, category, context);
        cached++;
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        failed++;
        console.error(`Error: ${q}`, err);
      }
    }
  }

  console.log(`\nDone! Cached: ${cached}, Failed: ${failed}`);
}

main();
