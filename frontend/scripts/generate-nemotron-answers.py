#!/usr/bin/env python3
"""
Generate answers for all cached questions using NVIDIA NIM Nemotron Nano 8B.
Outputs a JSON file comparing current (Claude) answers with Nemotron answers.
"""
import json
import time
import urllib.request
import urllib.error
import hashlib
import sys
import os

NIM_API_KEY = os.environ.get("NVIDIA_NIM_API_KEY", "")
NIM_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL = "nvidia/llama-3.1-nemotron-nano-8b-v1"

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

SYSTEM_PROMPT = """You are Undervolt, an AI analyst specializing in Austin, Texas construction permit data. You analyze 2.34 million geocoded permits (2000-2026) to reveal energy trends, grid gaps, and infrastructure patterns.

RULES:
- Lead with a bold statistic using **bold markdown**
- Keep answers to 2-3 concise paragraphs
- Cite specific numbers from the data provided
- Do NOT invent statistics — only use what's in the context
- Do NOT mention being an AI or language model
- Focus strictly on the topic asked about"""

# Category context blocks with placeholder data (will be enriched from Supabase)
CATEGORY_CONTEXTS = {
    "solar": """TOPIC: Solar Energy in Austin
- Total solar installations: 26,075
- Solar trend (peaked 2023): 2021: 1,834 → 2022: 1,956 → 2023: 2,097 → 2024: 1,567 → 2025: 1,139
- Solar-to-battery ratio: 9:1 (only 1 battery for every 9 solar installs)
- Average residential system size: 5kW to 12kW
- Austin Energy is the #1 municipal utility for solar per capita in the US (per SEIA)
- Austin Energy added a record 18.8 MW of rooftop solar in 2025 (749 projects)""",

    "battery": """TOPIC: Battery Storage in Austin
- Total battery systems: 2,874
- Solar-to-battery ratio: 9:1
- Battery growth: rapid increase since 2020, driven by grid reliability concerns
- Battery adoption correlates with income (0.78 wealth correlation)
- Austin Energy signed a 100 MW utility-scale battery deal with Jupiter Power
- Typical home battery system (Tesla Powerwall): $10,000–$15,000 installed""",

    "generators": """TOPIC: Backup Generators in Austin
- Total generators: 4,891
- Post-freeze surge: 312 permits in 2020 → 1,373 in 2021 (after Winter Storm Uri)
- Westlake vs East Austin: 5:1 ratio in backup power installations
- Generator demand stayed elevated through 2023, moderating in 2024
- Typical whole-home generator cost in Austin: $11,000–$13,000 (per KXAN reporting)""",

    "ev": """TOPIC: EV Chargers in Austin
- Total EV charger permits: 1,247
- EV charger growth: accelerating since 2020 with EV adoption
- East-west divide: West Austin has significantly more EV infrastructure
- Travis County has ~25,148 registered EVs (per Texas Standard, 2024)
- Austin received a $15M federal grant for 200+ stations in underserved areas
- Austin Energy operates ~1,500 L2 public charging ports""",

    "resilience": """TOPIC: Grid Resilience and Backup Power
- Total generators: 4,891 | Batteries: 2,874 | Panel upgrades: 3,200+
- Winter Storm Uri (Feb 2021) triggered a surge in backup power permits
- Westlake vs East Austin backup power: 5:1 ratio
- Wealth correlation with backup power: 0.78
- Austin Energy launched $735M Energy System Resiliency Plan (ESRP) post-Uri
- ESRP includes $60M in FY2026 for hardening 10 priority circuits""",

    "growth": """TOPIC: Construction Growth Trends (2000-2026)
- Scale: 2.34 million permits analyzed across Austin
- COVID impact: construction dipped in 2020, rebounded strongly 2021-2023
- Fastest growing: solar (+300% since 2015), demolition (+547%), ADUs (new category)
- Austin metro ranked #6 nationally in building permits (32,294 units authorized in 2024)
- Austin's 2024 permits were +42.6% above the 2000-2023 long-term average""",

    "equity": """TOPIC: Infrastructure Equity in Austin
- East-west divide: West Austin has 5x more backup power per capita
- Wealth correlation with energy infrastructure: 0.78
- EV deserts exist in eastern and southern Austin
- Solar adoption concentrated west of I-35
- Low-income ZIP codes have fewest battery + generator installations""",

    "districts": """TOPIC: Austin Districts and ZIP Code Analysis
- 2.34M permits across 70+ ZIP codes
- Highest permit density: downtown core and west Austin
- Fastest growing: east Austin suburbs, Mueller redevelopment area
- Infrastructure gaps: eastern ZIPs lag in solar, battery, EV infrastructure""",

    "pools": """TOPIC: Pool Construction in Austin
- Pool permits track closely with housing boom cycles
- Peak pool construction correlates with new home permits
- West Austin and lakeside ZIPs lead in pool installations""",

    "adus": """TOPIC: Accessory Dwelling Units (ADUs) in Austin
- ADU permits are a new category driven by zoning changes
- Austin's HOME ordinance expanded ADU allowances
- ADU adoption concentrated in central and east Austin""",

    "demolition": """TOPIC: Demolition Trends in Austin
- Demolition permits grew +547% over the analysis period
- Teardown-rebuild trend concentrated in central Austin
- Driven by land value exceeding structure value in desirable neighborhoods""",

    "east_west": """TOPIC: East-West Divide in Austin Infrastructure
- I-35 corridor divides Austin's infrastructure investment patterns
- West: 5x more generators, higher solar adoption, more EV chargers
- East: faster growth in new construction, catching up in solar
- Wealth correlation with infrastructure investment: 0.78""",
}


def guess_category(question: str) -> str:
    q = question.lower()
    if any(w in q for w in ["solar", "photovoltaic", "pv", "rooftop"]):
        return "solar"
    if any(w in q for w in ["battery", "storage", "powerwall", "backup storage"]):
        return "battery"
    if any(w in q for w in ["generator", "backup power", "standby"]):
        return "generators"
    if any(w in q for w in ["ev ", "charger", "electric vehicle", "charging"]):
        return "ev"
    if any(w in q for w in ["resilien", "grid", "outage", "uri", "freeze", "blackout"]):
        return "resilience"
    if any(w in q for w in ["growth", "construction", "permit trend", "building boom"]):
        return "growth"
    if any(w in q for w in ["equity", "divide", "gap", "disparity", "underserved"]):
        return "equity"
    if any(w in q for w in ["zip", "district", "neighborhood", "area"]):
        return "districts"
    if any(w in q for w in ["pool", "swimming"]):
        return "pools"
    if any(w in q for w in ["adu", "accessory", "dwelling", "granny"]):
        return "adus"
    if any(w in q for w in ["demolit", "teardown", "tear-down"]):
        return "demolition"
    if any(w in q for w in ["east", "west", "i-35", "divide"]):
        return "east_west"
    return "growth"


def call_nemotron(question: str, category: str, retries: int = 3) -> str:
    context = CATEGORY_CONTEXTS.get(category, CATEGORY_CONTEXTS["growth"])
    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{context}"},
        {"role": "user", "content": question},
    ]

    payload = json.dumps({
        "model": MODEL,
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": 512,
    }).encode()

    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                NIM_BASE_URL,
                data=payload,
                headers={
                    "Authorization": f"Bearer {NIM_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read())
                return result["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 10 * (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...", file=sys.stderr)
                time.sleep(wait)
            else:
                print(f"  Attempt {attempt + 1} failed: {e}", file=sys.stderr)
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
        except Exception as e:
            print(f"  Attempt {attempt + 1} failed: {e}", file=sys.stderr)
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    return f"ERROR: Failed after {retries} attempts"


TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")


def send_telegram(message: str):
    """Send a Telegram notification."""
    try:
        payload = json.dumps({
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "HTML",
        }).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"  Telegram send failed: {e}", file=sys.stderr)


def fetch_cached_answers():
    """Fetch all current cached answers from Supabase."""
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/cached_answers?select=id,question,answer,storyline&order=id.asc",
        headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def main():
    output_path = os.path.join(os.path.dirname(__file__), "..", "eval", "results", "nemotron-vs-current.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Resume support: load existing results if file exists
    results = []
    done_ids = set()
    if os.path.exists(output_path):
        with open(output_path) as f:
            results = json.load(f)
            done_ids = {r["id"] for r in results}
        print(f"Resuming — {len(results)} already done")

    print("Fetching cached questions from Supabase...")
    cached = fetch_cached_answers()
    remaining = [row for row in cached if row["id"] not in done_ids]
    print(f"Found {len(cached)} total, {len(remaining)} remaining\n")

    if remaining:
        send_telegram(f"🔄 <b>Nemotron generation started</b>\n\n{len(remaining)} questions remaining out of {len(cached)}")

    for i, row in enumerate(remaining):
        question = row["question"]
        category = guess_category(question)
        current_answer = row["answer"]

        # Extract just the message text from current answer
        current_text = ""
        if isinstance(current_answer, dict):
            current_text = current_answer.get("message", str(current_answer))
        elif isinstance(current_answer, str):
            try:
                parsed = json.loads(current_answer)
                current_text = parsed.get("message", current_answer)
            except:
                current_text = current_answer

        total_done = len(results) + 1
        print(f"[{total_done}/{len(cached)}] ({category}) {question[:70]}...")

        nemotron_answer = call_nemotron(question, category)

        results.append({
            "id": row["id"],
            "question": question,
            "category": category,
            "storyline": row.get("storyline"),
            "current_answer": current_text[:500] if len(current_text) > 500 else current_text,
            "nemotron_answer": nemotron_answer,
            "nemotron_model": MODEL,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })

        # Save after each question (crash-safe)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)

        # Send Telegram update for every question
        current_short = current_text[:200].replace("<", "&lt;").replace(">", "&gt;") if current_text else "(empty)"
        nemotron_short = nemotron_answer[:200].replace("<", "&lt;").replace(">", "&gt;") if nemotron_answer else "(empty)"
        is_error = nemotron_answer.startswith("ERROR")
        send_telegram(
            f"{'❌' if is_error else '📊'} <b>[{total_done}/{len(cached)}]</b> ({category})\n\n"
            f"❓ <b>{question[:80]}</b>\n\n"
            f"🔵 <b>Cached:</b>\n{current_short}\n\n"
            f"🟢 <b>Nemotron:</b>\n{nemotron_short}"
        )

        # NIM free tier — moderate delay to be safe
        time.sleep(1.5)

    print(f"\nDone! {len(results)} answers saved to {output_path}")

    errors = sum(1 for r in results if r["nemotron_answer"].startswith("ERROR"))
    send_telegram(
        f"✅ <b>Nemotron generation complete</b>\n\n"
        f"Total: {len(results)} | Success: {len(results) - errors} | Errors: {errors}\n"
        f"File: eval/results/nemotron-vs-current.json"
    )
    print(f"Successful: {len(results) - errors} | Errors: {errors}")


if __name__ == "__main__":
    main()
