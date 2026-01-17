#!/usr/bin/env python3
"""
Fast rule-based categorization for permit descriptions.
Processes ~10K permits/sec using regex patterns.
"""

import sqlite3
import re
from collections import defaultdict

DB_PATH = "/home/red/Documents/github/undervolt/data/undervolt.db"

# Project type patterns - order matters (first match wins)
PROJECT_PATTERNS = {
    'demolition': r'\bdemoli|tear.?down|raze|remove.*structure\b',
    'new_construction': r'\bnew\b.*\b(construct|build|home|house|residential|commercial|sfr|single.?family|pool|deck|garage|story|bedroom|bath|carport|dwelling|residence|fence|patio|shed|barn|apartment|duplex|multi.?family|shell|irrigation|condominium|portable|classroom|trailer)\b|\bnew\s+(sfr|res|comm|pool|in.?ground|exterior|interior|sign|apartment|duplex)|^\s*(one|two|1|2)\s*(stry|story).*(res|dup|pud)|sf\s+residence|sf\s+res|frm\s+(res|dup)|^\s*\d\s+stry\s+frm\s+(res|dup|pud)|\b(one|two|1|2)\s+story\s+residence|connect\s+(mobile|mh|m/h|sign|equipment)\b|^mobile\s*home$|^\s*res\s*$|^residence$|^duplex$|^triplex$|^four\s*plex$|^townhouse$|swimming\s*pool|^pool$|move\s+(mobile|house)|relocate.*(house|portable|classroom)|addn\s+to\s+res|detached\s+garage|^apartments$|loop\s+for\s+(mh|mobile|sign)|temporary\s+(construction\s+)?trailer',
    'renovation': r'\brenovate|remodel|alteration|addition|upgrade|moderniz|improve|convert|finish.?out|suite|tenant|add\s+(ac|a/c)|upgrading?\s+.*elec|rem\s+exist.*lease\b',
    'repair': r'\brepair|fix|replace|replac|repalc|restore|patch|mend|cap\s+off|top\s+out|change.?out|re.?roof|reroof|cut\s+over\b',
    'installation': r'\binstall|setup|mount|put\s+in|meter\s+loop|temporary\s+(pole|meter|power)|irrigation|h.?t\s+loop|h\s+(&|and)\s+t\s+loop|loop\s+for\s+cable|pull(ed)?\s+(gas\s+)?meter|gas\s+test|elevator|stove\s+hood|^h-t$|^plg\s+only$|^comm$\b',
    'maintenance': r'\bmaintenance|upkeep|service|inspect|violation\b',
}

# Building type patterns
BUILDING_PATTERNS = {
    'residential_single': r'\bsfr|single.?family|residence|home|house|dwelling|bedroom|carport|pool|spa|mobile\s*home|^\s*res\s*$|^residence$|frm\s+res|sf\s+(res|residence)|(one|two|1|2)\s*(stry|story).*res|swimming\s*pool|^pool$|detached\s+garage|addn\s+to\s+res\b(?!.*multi|.*apart|.*duplex|.*condo|.*plex)',
    'residential_multi': r'\bmulti.?family|apartment|condo|duplex|triplex|townhome|townhouse|four\s*plex|unit|bldg\s*\d+|^duplex$|^triplex$|^apartments$|new\s+(apartments|condominium)|frm\s+(dup|pud)|\d\s+stry\s+frm\s+(dup|pud)\b',
    'commercial': r'\bcommercial|office|retail|store|shop|restaurant|hotel|business|suite|tenant|sign|shell\s*building|portable\s+classroom|^comm$\b',
    'industrial': r'\bindustrial|warehouse|factory|manufacturing|plant\b',
    'infrastructure': r'\binfrastructure|utility|public|municipal|government|pole|meter|h.?t\s+loop|elevator|sewer\b',
}

# Trade patterns
TRADE_PATTERNS = {
    'electrical': r'\belectric|wiring|panel|circuit|outlet|meter|amp\b',
    'plumbing': r'\bplumb|pipe|drain|sewer|water\s+heat|toilet|faucet\b',
    'hvac': r'\bhvac|air\s*condition|heating|cooling|furnace|a\/c|ac\s+unit|duct\b',
    'roofing': r'\broof|shingle|gutter\b',
    'foundation': r'\bfoundation|slab|footing|concrete|pier\b',
    'structural': r'\bstructural|framing|load.?bearing|beam|joist\b',
    'landscaping': r'\blandscape|irrigation|sprinkler|fence|deck|patio\b',
}

# Scale patterns
SCALE_PATTERNS = {
    'major': r'\bnew\s+(construct|build)|addition|major|extensive|complete|full\b',
    'minor': r'\bminor|small|simple|basic|routine|permit\s+only\b',
    'moderate': r'\bmoderate|partial|some|several\b',
}

# Green/energy patterns
GREEN_PATTERN = r'\bsolar|photovoltaic|pv\s+system|ev\s+charg|battery|energy\s+storage|geothermal|wind\s+turb|green\s+build\b'


def categorize_description(desc: str) -> dict:
    """Categorize a single description using regex patterns."""
    if not desc:
        return {}

    desc_lower = desc.lower()
    result = {}

    # Project type
    for ptype, pattern in PROJECT_PATTERNS.items():
        if re.search(pattern, desc_lower, re.IGNORECASE):
            result['project_type'] = ptype
            break

    # Building type
    for btype, pattern in BUILDING_PATTERNS.items():
        if re.search(pattern, desc_lower, re.IGNORECASE):
            result['building_type'] = btype
            break

    # Trade
    for trade, pattern in TRADE_PATTERNS.items():
        if re.search(pattern, desc_lower, re.IGNORECASE):
            result['trade'] = trade
            break
    if 'trade' not in result:
        result['trade'] = 'general'

    # Scale
    for scale, pattern in SCALE_PATTERNS.items():
        if re.search(pattern, desc_lower, re.IGNORECASE):
            result['scale'] = scale
            break
    if 'scale' not in result:
        result['scale'] = 'minor'

    # Green/energy
    result['is_green'] = 1 if re.search(GREEN_PATTERN, desc_lower, re.IGNORECASE) else 0

    return result


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Get uncategorized permits
    cur.execute("""
        SELECT id, work_description
        FROM permits
        WHERE project_type IS NULL AND work_description IS NOT NULL
        LIMIT 2000000
    """)

    permits = cur.fetchall()
    print(f"Processing {len(permits):,} uncategorized permits...")

    # Categorize in batches
    batch_size = 10000
    total_updated = 0
    stats = defaultdict(lambda: defaultdict(int))

    for i in range(0, len(permits), batch_size):
        batch = permits[i:i+batch_size]
        updates = []

        for permit_id, desc in batch:
            cats = categorize_description(desc)
            if cats:
                updates.append((
                    cats.get('project_type'),
                    cats.get('building_type'),
                    cats.get('scale'),
                    cats.get('trade'),
                    cats.get('is_green', 0),
                    permit_id
                ))
                # Track stats
                for k, v in cats.items():
                    if v is not None:
                        stats[k][v] += 1

        # Batch update
        cur.executemany("""
            UPDATE permits SET
                project_type = ?,
                building_type = ?,
                scale = ?,
                trade = ?,
                is_green = ?
            WHERE id = ?
        """, updates)

        total_updated += len(updates)
        conn.commit()

        pct = 100 * (i + len(batch)) / len(permits)
        print(f"  [{i+len(batch):,}/{len(permits):,}] ({pct:.1f}%) - {total_updated:,} updated")

    print(f"\n✅ Categorized {total_updated:,} permits")

    # Print distribution
    print("\n=== Distribution ===")
    for category, values in sorted(stats.items()):
        print(f"\n{category.upper()}:")
        for value, count in sorted(values.items(), key=lambda x: -x[1])[:5]:
            print(f"  {str(value):20} {count:>8,}")

    conn.close()


if __name__ == "__main__":
    main()
