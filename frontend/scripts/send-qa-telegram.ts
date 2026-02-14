import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import os from "os";
import { CATEGORY_QUESTIONS, CATEGORY_CONFIG, type Category } from "../src/lib/modes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN!;
const TG_CHAT_ID = process.env.TG_CHAT_ID!;
const HOMENEST_URL = process.env.HOMENEST_URL || "http://localhost:9000";

function hashQuestion(q: string): string {
  return crypto.createHash("md5").update(q.toLowerCase().trim()).digest("hex");
}

// External validation sources by category (researched Feb 2026)
const VALIDATION_SOURCES: Record<Category, string[]> = {
  solar: [
    "SEIA Texas Solar Fact Sheet (34,907 MW installed Q2 2024) — https://seia.org/state-solar-policy/texas-solar/",
    "Austin Energy: Record 18.8 MW Local Solar Added in 2024 (749 projects, 15K+ customers total) — https://austinenergy.com/about/news/news-releases/2025/austin-energy-adds-record-18mw-of-local-solar-to-the-grid",
    "Austin Energy Solar for All: $31.5M EPA Grant for Low-Income Solar — https://austinenergy.com/about/news/news-releases/2024/solar",
  ],
  battery: [
    "TX Comptroller: Battery Storage +4,100% (2020-2024), 5,707 MW — https://comptroller.texas.gov/economy/fiscal-notes/infrastructure/2024/battery-store/",
    "Canary Media: TX Added 4,374 MW Battery in 2024, 8.6 GW Total — https://www.canarymedia.com/articles/energy-storage/how-texas-became-the-hottest-battery-market-in-the-country-energy-storage",
    "Austin Energy: 100 MW Battery Deal w/ Jupiter Power (largest ever) — https://austinenergy.com/about/news/news-releases/2025/austin-energy-signs-battery-storage-deal",
  ],
  generators: [
    "KXAN: Generator Permits 43(2020) to 303(first 8mo 2021), ~1200% increase — https://www.kxan.com/investigations/austin-home-generator-sales-skyrocket-installations-backlogged-after-winter-storm/",
    "Austin Bulldog: Post-Uri Generator Rush, $11-13K avg install — https://theaustinbulldog.org/backup-plan-part-1-unreliable-electric-system-creates-rush-to-backup-generators/",
    "TX Comptroller: Winter Storm Uri Economic Impact — https://comptroller.texas.gov/economy/fiscal-notes/archive/2021/oct/winter-storm-impact.php",
  ],
  ev: [
    "PLOS ONE: EV Charger Access Disparities in Austin (peer-reviewed) — https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0309302",
    "Axios: 2%+ of Travis County vehicles are EVs, AE operates ~1,500 L2 ports — https://www.axios.com/local/austin/2025/01/28/ev-charging-stations-texas",
    "Austin Energy: $15M+$3.75M Grant for EV Charging Expansion — https://austinenergy.com/about/news/news-releases/2025/austin-energy-secures-$15-million-grant-to-expand-electric-vehicle-charging-infrastructure",
  ],
  resilience: [
    "Austin Energy: 10-Year $735M Grid Resiliency Plan (ESRP) — https://austinenergy.com/about/news/news-releases/2025/austin-energy-announces-targeted-plan-to-build-an-even-stronger-smarter-more-reliable-grid",
    "TX Tribune: ERCOT Inspected 4,000+ Facilities Post-Uri — https://www.texastribune.org/2026/01/29/texas-winter-storm-uri-anniversary-power-grid-ercot/",
    "TPPF: TX Grid Still Vulnerable Despite Improvements — https://www.texaspolicy.com/fool-me-twice-why-the-texas-grid-is-still-vulnerable-to-winter-storms/",
  ],
  growth: [
    "Team Price: 32,294 New Units in Austin Metro 2024, #2 Nationally — https://teamprice.com/articles/austin-building-permits-surge-2024-data",
    "CultureMap: Austin #6 Metro for New Home Building — https://austin.culturemap.com/news/real-estate/new-home-construction-austin-ranking/",
    "City of Austin Open Data: Annual Building Permits — https://data.austintexas.gov/Building-and-Development/Annual-Number-of-Building-Permits-Issued/i6ug-2wu7",
  ],
  equity: [
    "Austin Climate Equity Plan: Disproportionate Burden on Communities of Color — https://www.austintexas.gov/page/austin-climate-equity-plan",
    "Utility Dive: Low-Income Households Spend 8.3% of Income on Energy — https://www.utilitydive.com/news/low-income-energy-burden-report-american-council-for-energy-efficient-economy/727012/",
    "PLOS ONE: Race/Income Predict EV Charger Access in Austin — https://pmc.ncbi.nlm.nih.gov/articles/PMC11376518/",
  ],
  districts: [
    "City of Austin FY 2024-25 Budget: $5.9B Total — https://www.austintexas.gov/news/austin-city-council-approves-fiscal-year-2024-2025-budget",
    "Open Data: Demolition Permits by Zip/Type — https://data.austintexas.gov/Building-and-Development/Demolition-Permits-Summary-by-Zipcode-and-Type/yiii-tj7t",
    "Open Data: Demolition Permits Since FY2010 (w/ council district) — https://data.austintexas.gov/Building-and-Development/Demolition-Permits-Issued-since-FY2010/pws3-a5fj",
  ],
  pools: [
    "Axios: 18K Pool Permits Since 1978, Quarter Issued in Last 3.5 Years — https://www.axios.com/local/austin/2023/07/26/austin-pool-construction",
    "HBWeekly: Austin 1,215 Pool Permits in 2024 (12% YoY decrease) — https://blog.hbweekly.com/texas-swimming-pool-construction-annual-review-2024/",
    "HBWeekly: Austin 1,375 Pool Permits in 2023 (32% YoY decrease) — https://blog.hbweekly.com/texas-annual-report-swimming-pool-construction-2023/",
  ],
  adu: [
    "KXAN: 264 HOME Initiative Applications, Permits +86% — https://www.kxan.com/news/local/austin/what-are-we-getting-we-pulled-the-data-from-264-home-initiative-applications/",
    "Maxable: HOME Initiative ADU Regulation Changes 2024 — https://maxablespace.com/austins-home-initiative-shakes-up-adu-regulations-in-2024/",
    "Community Impact: 436 Housing Units in 1st Year of HOME — https://communityimpact.com/austin/north-central-austin/government/2025/11/19/austins-home-policy-spurs-hundreds-of-housing-units-in-1st-year-cost-displacement-trends-unclear/",
  ],
  demolition: [
    "City of Austin: Demolitions Dashboard (78702, 78704 top ZIPs) — https://data.austintexas.gov/stories/s/Demolitions-in-Austin/i2tv-k59a/",
    "YES! Magazine: Upzoning Leads to Luxury in Working-Class Areas — https://www.yesmagazine.org/opinion/2024/07/11/city-texas-green-gentrification",
    "Open Data: Demolition Sq Feet by Zip (Central +40% in 2 years) — https://data.austintexas.gov/Building-and-Development/New-Demolition-Sq-Feet-by-Zip-Codes/gvve-575h",
  ],
  eastwest: [
    "KUT: East Austin Real Estate Explosion from 1928 Segregation — https://www.kut.org/austin/2023-06-22/two-paragraphs-forced-black-residents-to-east-austin-exploding-real-estate-prices-forced-them-out",
    "Axios: $1.12M Grant to Study I-35 Divide (78% vs 22% tree canopy) — https://www.axios.com/local/austin/2023/03/20/austin-awarded-112m-study-i-35-divide",
    "Urban Displacement: Austin Gentrification Map (78702 +74.3% income) — https://www.urbandisplacement.org/maps/austin-gentrification-and-displacement/",
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
  // Try Homenest gateway first
  try {
    const res = await fetch(`${HOMENEST_URL}/api/telegram/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "undervolt-qa",
        message: text,
        parse_mode: "HTML",
        device: os.hostname().split(".")[0],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.sent) return true;
      // Gateway rejected (disabled/snoozed/rate-limited)
      console.log(`Gateway blocked: ${result.reason}`);
      return false;
    }
  } catch {
    console.log("Homenest unreachable, falling back to direct Telegram");
  }

  // Fallback: direct Telegram API
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
