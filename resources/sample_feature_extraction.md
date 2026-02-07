# Sample Feature Extraction - 20 Permits

## Extracted Signals

| # | Permit | Description Summary | Signals Extracted |
|---|--------|---------------------|-------------------|
| 1 | 2024-131428 PP | Water heater replacement | `{"work_type": "repair", "housing_type": "residential", "infrastructure": "water_heater", "is_upgrade": false}` |
| 2 | 2025-135431 MP | Mini split system replacement | `{"work_type": "repair", "housing_type": "residential", "infrastructure": "hvac", "hvac_type": "mini_split", "is_upgrade": true}` |
| 3 | 2025-061913 EP | Homebuilder loop ETJ | `{"work_type": "new_construction", "housing_type": "residential", "is_etj": true}` |
| 4 | 2025-062734 BP | Foundation repair | `{"work_type": "repair", "housing_type": "residential", "repair_type": "foundation"}` |
| 5 | 2024-153929 EP | Commercial temp loop | `{"work_type": "temporary", "housing_type": "commercial"}` |
| 6 | 2024-042999 PP | Office interior remodel 26,868 SF | `{"work_type": "remodel", "housing_type": "commercial", "sqft": 26868, "building_type": "office"}` |
| 7 | 2025-017371 EP | Homebuilder tpole | `{"work_type": "new_construction", "housing_type": "residential"}` |
| 8 | 2025-042598 EP | **New condo duplex 2 units** | `{"work_type": "new_construction", "housing_type": "multi_family", "unit_type": "condo", "units": 2, "bedrooms": 2, "is_duplex": true}` |
| 9 | 2024-146673 PP | Drain line repair | `{"work_type": "repair", "housing_type": "residential", "infrastructure": "plumbing"}` |
| 10 | 2022-105751 PP | **Multifamily interior remodel** | `{"work_type": "remodel", "housing_type": "multi_family"}` |
| 11 | 2024-090602 EP | **New 400 sqft dwelling with kitchen/bath** | `{"work_type": "new_construction", "housing_type": "residential", "is_adu": true, "sqft": 400, "bedrooms": 1, "bathrooms": 1}` |
| 12 | 2025-051051 BP | **Total demo manufactured home** | `{"work_type": "demolition", "housing_type": "residential", "demo_type": "total", "building_type": "manufactured_home", "sqft": 896}` |
| 13 | 2025-028436 PP | New 2-story SFR 4bed 3bath | `{"work_type": "new_construction", "housing_type": "single_family", "stories": 2, "bedrooms": 4, "bathrooms": 3, "has_garage": true}` |
| 14 | 2024-128161 BP | Stone retaining wall | `{"work_type": "new_construction", "housing_type": "commercial", "structure_type": "retaining_wall", "valuation": 10917}` |
| 15 | 2024-157495 EP | Mobile home connection | `{"work_type": "addition", "housing_type": "residential", "building_type": "mobile_home"}` |
| 16 | 2025-033199 MP | **Major SFR remodel - tankless water heater** | `{"work_type": "remodel", "housing_type": "single_family", "infrastructure": ["water_heater", "windows", "kitchen"], "is_tankless": true, "is_major_remodel": true}` |
| 17 | 2024-125393 PP | **New 2-story secondary apartment** | `{"work_type": "new_construction", "housing_type": "residential", "is_adu": true, "stories": 2, "bedrooms": 2, "bathrooms": 1.5}` |
| 18 | 2024-098489 EP | Homebuilder loop | `{"work_type": "new_construction", "housing_type": "residential"}` |
| 19 | 2024-140455 EP | Temp power jobsite | `{"work_type": "temporary", "housing_type": "commercial", "is_state_building": true}` |
| 20 | 2025-099133 EP | Homebuilder loop new SFR | `{"work_type": "new_construction", "housing_type": "single_family"}` |

---

## High-Value Signal Summary (from 20 samples)

| Signal | Found | Examples |
|--------|-------|----------|
| **ADU/Secondary Dwelling** | 2 | #11 (400sqft dwelling), #17 (secondary apartment) |
| **Multi-Family** | 2 | #8 (condo duplex), #10 (multifamily remodel) |
| **Demolition** | 1 | #12 (total demo manufactured home) |
| **Major Remodel** | 2 | #6 (26K sqft office), #16 (full SFR remodel) |
| **New Single Family** | 3 | #13, #18, #20 |
| **Infrastructure Upgrade** | 2 | #2 (mini split), #16 (tankless water heater) |
| **ETJ (Extra-Territorial)** | 1 | #3 |

---

## Recommended LLM Feature Schema

Based on this sample, here's the optimal feature extraction schema:

```json
{
  "permit_id": "string",

  // Core classification
  "work_type": "new_construction" | "remodel" | "repair" | "demolition" | "addition" | "temporary",
  "housing_type": "single_family" | "multi_family" | "commercial" | "mixed_use",

  // High-value urban growth signals
  "is_adu": boolean,           // Accessory dwelling unit - KEY DENSITY SIGNAL
  "is_ev_charger": boolean,    // EV infrastructure
  "is_solar": boolean,         // Solar installation
  "is_demolition": boolean,    // Teardown activity

  // Housing details (when applicable)
  "units": number | null,      // Number of units
  "bedrooms": number | null,
  "bathrooms": number | null,
  "stories": number | null,
  "sqft": number | null,

  // Infrastructure signals
  "infrastructure_type": ["hvac", "electrical", "plumbing", "water_heater", "foundation"] | null,
  "is_upgrade": boolean,       // Upgrade vs like-for-like replacement

  // Building type details
  "building_type": "sfr" | "condo" | "apartment" | "office" | "retail" | "manufactured" | "mobile" | null,

  // Derived signals for trend analysis
  "density_signal": "increasing" | "stable" | null,  // ADU, multi-family = increasing
  "electrification_signal": boolean                   // EV, solar, panel upgrades
}
```

---

## Key Observations

1. **ADUs are identifiable** - Look for "secondary apartment", "guest house", small sqft dwellings with kitchen/bath
2. **Unit counts extractable** - Descriptions often include bedroom/bathroom counts
3. **Infrastructure upgrades detectable** - "tankless", "mini split" indicate modernization
4. **Demolition types matter** - "total demo" vs partial renovation
5. **ETJ flags present** - Permits note when in Extra-Territorial Jurisdiction
6. **Multi-family buried in text** - Need LLM to catch "multifamily", "duplex", "condo regime"
