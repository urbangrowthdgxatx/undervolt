import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { CATEGORY_QUESTIONS, CATEGORY_CONFIG, type Category } from "../src/lib/modes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN!;
const TG_CHAT_ID = process.env.TG_CHAT_ID!;

function hashQuestion(q: string): string {
  return crypto.createHash("md5").update(q.toLowerCase().trim()).digest("hex");
}

// External validation sources by category
const VALIDATION_SOURCES: Record<Category, string[]> = {
  solar: [
    "SEIA Texas Solar Fact Sheet — https://www.seia.org/state-solar-policy/texas-solar",
    "Austin Energy Solar Programs — https://austinenergy.com/green-power/a-background-on-solar-energy",
    "EIA Texas Solar Generation Data — https://www.eia.gov/state/?sid=TX#tabs-4",
  ],
  battery: [
    "SEIA Texas Solar + Storage — https://www.seia.org/state-solar-policy/texas-solar",
    "Texas Battery Storage Boom (Utility Dive) — https://www.utilitydive.com/topic/energy-storage/",
    "Austin Energy Battery Incentives — https://austinenergy.com/green-power",
  ],
  generators: [
    "Winter Storm Uri Impact (Texas Tribune) — https://www.texastribune.org/series/winter-storm-power-outage/",
    "FEMA Winter Storm Uri Disaster Declaration — https://www.fema.gov/disaster/4586",
    "Austin American-Statesman Uri Coverage — https://www.statesman.com/",
  ],
  ev: [
    "DOE Alternative Fuels Station Locator — https://afdc.energy.gov/stations",
    "Austin Climate Equity Plan — https://www.austintexas.gov/page/austin-climate-equity-plan",
    "Texas EV Registration Data (TxDOT) — https://www.txdot.gov/",
  ],
  resilience: [
    "ERCOT Grid Status — https://www.ercot.com/gridmktinfo/dashboards",
    "Austin Energy Storm Preparedness — https://austinenergy.com/outages-and-safety/power-outages",
    "Texas Winter Storm Uri After-Action (FERC/NERC) — https://www.ferc.gov/media/february-2021-cold-weather-grid-operations",
  ],
  growth: [
    "Austin Open Data Portal (Permits) — https://data.austintexas.gov/",
    "Austin Chamber Economic Report — https://www.austinchamber.com/economic-development",
    "U.S. Census Bureau Building Permits — https://www.census.gov/construction/bps/",
  ],
  equity: [
    "Austin Climate Equity Plan — https://www.austintexas.gov/page/austin-climate-equity-plan",
    "Austin Community Climate Plan — https://www.austintexas.gov/page/community-climate-plan",
    "Austin Displacement Mitigation — https://www.austintexas.gov/department/displacement-mitigation",
  ],
  districts: [
    "Austin Council District Map — https://www.austintexas.gov/department/city-council",
    "Austin Demographics by District — https://www.austintexas.gov/demographics",
    "Austin Open Data Portal — https://data.austintexas.gov/",
  ],
  pools: [
    "Austin Permit Data (Open Data) — https://data.austintexas.gov/",
    "Austin Business Journal Real Estate — https://www.bizjournals.com/austin/news/real-estate",
    "Zillow Austin Housing Market — https://www.zillow.com/austin-tx/home-values/",
  ],
  adu: [
    "Austin HOME Initiative — https://www.austintexas.gov/department/housing-and-planning/home",
    "Austin Monitor ADU Coverage — https://www.austinmonitor.com/",
    "Austin Land Development Code — https://www.austintexas.gov/department/development-services",
  ],
  demolition: [
    "Austin Historic Preservation — https://www.austintexas.gov/department/historic-preservation",
    "Austin Open Data (Demolition Permits) — https://data.austintexas.gov/",
    "Austin American-Statesman Gentrification — https://www.statesman.com/",
  ],
  eastwest: [
    "Austin Uprooted (UT Gentrification Study) — https://sites.utexas.edu/gentrificationproject/",
    "Austin Climate Equity Plan — https://www.austintexas.gov/page/austin-climate-equity-plan",
    "KUT Austin East Side Coverage — https://www.kut.org/",
  ],
};

// Context data per category (summary of what Supabase data was used)
function getCategoryDataContext(category: Category, analyticsData: any): string {
  const { totals, topZips, energyZips } = analyticsData;
  const solarBatteryRatio = Math.round(totals.solar / Math.max(totals.battery, 1));

  const contexts: Record<Category, string> = {
    solar: `Solar total: ${totals.solar.toLocaleString()} | Top ZIPs: ${topZips.slice(0, 5).map((z: any) => `${z.zip_code}(${z.solar})`).join(", ")} | Trend: 2021:1834→2022:1956→2023:2097→2024:1567→2025:1139`,
    battery: `Battery total: ${totals.battery.toLocaleString()} | Solar:Battery ratio ${solarBatteryRatio}:1 | Top ZIPs: ${topZips.slice(0, 5).map((z: any) => `${z.zip_code}(${z.battery})`).join(", ")}`,
    generators: `Generator total: ${totals.generator.toLocaleString()} | Post-Uri surge: 312(2020)→1373(2021) +340% | Westlake vs East: 5:1 | Top ZIPs: ${topZips.slice(0, 5).map((z: any) => `${z.zip_code}(${z.generator})`).join(", ")}`,
    ev: `EV charger total: ${totals.evCharger.toLocaleString()} | Top ZIPs: ${topZips.slice(0, 5).map((z: any) => `${z.zip_code}(${z.ev_charger})`).join(", ")} | West > East in infrastructure`,
    resilience: `Generators: ${totals.generator.toLocaleString()} | Batteries: ${totals.battery.toLocaleString()} | Panel upgrades: ${totals.panelUpgrade.toLocaleString()} | Wealth correlation: 0.78 | Westlake vs East: 5:1`,
    growth: `2.34M total permits | Solar +300% since 2015 | Demo +547% | COVID dip 2020, rebound 2021-2023`,
    equity: `Wealth correlation 0.78 | Westlake vs East Austin 5:1 backup power | Solar gap 3-4x per capita`,
    districts: `10 council districts | D10 highest backup/capita | D1 lowest | 3-5x variation between districts`,
    pools: `Pool permits concentrated in west/NW Austin | Highest in 78746, 78703, 78731 | Strong income correlation`,
    adu: `ADU growth since HOME Initiative 2023 | Top ZIPs: 78704, 78745, 78702 | Densification trend`,
    demolition: `Demo +547% since 2015 | Top teardown ZIPs: 78702, 78704, 78722 | Accelerated 2018-2023`,
    eastwest: `West: more solar(3-4x), generators(5:1), pools | East: more demolition, gentrification | 0.78 income correlation`,
  };
  return contexts[category];
}

async function loadAnalyticsData() {
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

function escapeMarkdown(text: string): string {
  // Escape Telegram MarkdownV2 special chars, but preserve our formatting
  return text
    .replace(/([_\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

async function sendTelegram(text: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram error:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Telegram send failed:", err);
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function main() {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    console.error("Missing TG_BOT_TOKEN or TG_CHAT_ID in environment");
    process.exit(1);
  }

  console.log("Loading analytics data...");
  const analyticsData = await loadAnalyticsData();
  console.log("Analytics loaded.\n");

  const categories = Object.keys(CATEGORY_QUESTIONS) as Category[];
  let sent = 0;
  let failed = 0;

  for (const category of categories) {
    const questions = CATEGORY_QUESTIONS[category];
    const label = CATEGORY_CONFIG[category].label;
    const dataContext = getCategoryDataContext(category, analyticsData);
    const validationSources = VALIDATION_SOURCES[category];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const hash = hashQuestion(question);

      // Fetch cached answer from Supabase
      const { data, error } = await supabase
        .from("cached_answers")
        .select("answer")
        .eq("question_hash", hash)
        .single();

      let llmAnswer = "(not cached yet)";
      let keyStat = "(none)";

      if (data?.answer) {
        const answerObj = typeof data.answer === "string" ? JSON.parse(data.answer) : data.answer;
        llmAnswer = answerObj.message || "(empty)";
        keyStat = answerObj.storyBlock?.dataPoint?.value || "(none)";
      }

      // Build Telegram message using HTML formatting
      const validationLines = validationSources.map(s => `• ${escapeHtml(s)}`).join("\n");

      const message = [
        `<b>${escapeHtml(label)} — Q${i + 1}/8</b>`,
        ``,
        `<b>Question:</b> ${escapeHtml(question)}`,
        ``,
        `<b>Data Context:</b>`,
        `<code>${escapeHtml(dataContext)}</code>`,
        ``,
        `<b>LLM Answer:</b>`,
        `${escapeHtml(llmAnswer)}`,
        ``,
        `<b>Key Stat:</b> ${escapeHtml(keyStat)}`,
        ``,
        `<b>External Validation:</b>`,
        validationLines,
      ].join("\n");

      const ok = await sendTelegram(message);
      if (ok) {
        sent++;
        console.log(`✓ [${sent}/${96}] ${label} Q${i + 1}: ${question}`);
      } else {
        failed++;
        console.error(`✗ FAILED: ${label} Q${i + 1}: ${question}`);
      }

      // Rate limit: Telegram allows ~30 msgs/sec, but let's be conservative
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}`);
}

main();
