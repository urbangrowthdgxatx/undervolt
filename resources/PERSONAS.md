# User Personas

## 1. City Planner - "Planning Patricia"

| Attribute | Details |
|-----------|---------|
| **Role** | Austin City Planning Department |
| **Pain Point** | Can't see where density is actually happening |
| **Questions** | "Which neighborhoods are adding ADUs?" "Where do we need grid upgrades?" |
| **Uses Our Tool To** | Map ADU clusters, identify infrastructure strain hotspots |
| **Key Signals** | `is_adu`, `is_panel_upgrade`, `units` |

**Demo Query:** "Show me ADU permits by zip code over the last 2 years"

---

## 2. Utility Company Analyst - "Grid Gary"

| Attribute | Details |
|-----------|---------|
| **Role** | Austin Energy demand forecasting |
| **Pain Point** | Can't predict where electrical load is increasing |
| **Questions** | "Where are EV chargers concentrating?" "Which areas adding solar?" |
| **Uses Our Tool To** | Forecast grid load by neighborhood |
| **Key Signals** | `is_ev_charger`, `is_solar`, `solar_kw`, `is_panel_upgrade` |

**Demo Query:** "Show EV charger installations by zip, compare to panel upgrades"

---

## 3. Real Estate Developer - "Developer Dave"

| Attribute | Details |
|-----------|---------|
| **Role** | Multi-family developer |
| **Pain Point** | Needs to know where growth is happening |
| **Questions** | "Which zip codes have most new construction?" "Where are teardowns happening?" |
| **Uses Our Tool To** | Find emerging neighborhoods, comparable projects |
| **Key Signals** | `units`, `housing_type`, demolition permits |

**Demo Query:** "Multi-family permits over 10 units in last 12 months"

---

## 4. Resilience Officer - "Emergency Emma"

| Attribute | Details |
|-----------|---------|
| **Role** | City emergency management |
| **Pain Point** | Doesn't know which areas are grid-resilient after 2021 freeze |
| **Questions** | "Which neighborhoods have backup power?" "Where are we vulnerable?" |
| **Uses Our Tool To** | Map resilience (generators + batteries + solar) |
| **Key Signals** | `has_generator`, `has_battery`, `is_solar` |

**Demo Query:** "Calculate grid resilience score by zip (generator + battery + solar)"

---

## 5. Policy Researcher - "Research Rachel"

| Attribute | Details |
|-----------|---------|
| **Role** | UT Austin urban policy researcher |
| **Pain Point** | Can't measure policy impact from permit data |
| **Questions** | "Did ADU policy increase density?" "Is electrification equitable across neighborhoods?" |
| **Uses Our Tool To** | Compare signals across income levels, time periods |
| **Key Signals** | All signals + geographic analysis |

**Demo Query:** "Compare electrification signals: East Austin vs West Austin"

---

## Persona Signal Matrix

| Persona | Primary Signals | Secondary Signals |
|---------|-----------------|-------------------|
| City Planner | `is_adu`, `units` | `is_panel_upgrade`, `housing_type` |
| Utility Analyst | `is_ev_charger`, `is_solar` | `solar_kw`, `is_panel_upgrade` |
| Developer | `units`, `housing_type` | demolition, valuation |
| Resilience Officer | `has_generator`, `has_battery` | `is_solar` |
| Policy Researcher | All | Geographic comparisons |

---

## Recommended Demo Focus

For hackathon, focus on **2 personas** that tell a cohesive story:

### Option A: Grid Resilience Story
**Personas:** Utility Analyst + Resilience Officer

**Narrative:** "After the 2021 freeze, Austin is building grid independence. We can see it in the permits - generators up 40%, solar + battery combos growing, EV infrastructure expanding. But it's not even - some neighborhoods are resilient, others are vulnerable."

**Signals:** `is_ev_charger`, `is_solar`, `has_battery`, `has_generator`

### Option B: Density & Growth Story
**Personas:** City Planner + Developer

**Narrative:** "Austin's density policy is working - but where? ADUs are clustering in specific neighborhoods. Multi-family is booming in certain corridors. We extract these hidden signals to show where the city is actually growing."

**Signals:** `is_adu`, `units`, `housing_type`

### Option C: Complete Urban Intelligence
**Personas:** City Planner + Utility Analyst

**Narrative:** "The full picture - where Austin is growing AND how it's powering that growth. Density signals meet electrification signals. This is the city's physical future, extracted from permit text."

**Signals:** All signals
