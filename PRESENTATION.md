# Undervolt: Presentation Notes

## The Pivot

We started building a traditional dashboard — charts, graphs, filters. The classic "here's your data, go explore" approach.

Then we realized: **dashboards tell the same story to everyone.**

A city planner and a solar installer look at the same bar chart. One sees policy implications. The other sees sales territory. The visual is identical, but what matters to each is completely different.

So we pivoted.

---

## The Insight: LLM as Pattern Manager

Instead of pre-computing visualizations, we leaned into what LLMs actually do well: **connecting patterns across data based on the questions you ask.**

The LLM doesn't just query the database. It becomes a pattern manager that:
- Understands the relationships between solar, batteries, generators, and grid trust
- Connects permit activity to neighborhood characteristics
- Surfaces correlations that a static chart would never show

Ask "why are there so many generators in Westlake?" and it connects:
- Post-2021 freeze trauma
- Wealth enabling backup systems
- Grid distrust in areas that can afford alternatives

A bar chart can't do that.

---

## Build Your Own Austin Story

Every user builds a **unique narrative** based on what they care about.

| User | Their Question | Their Story |
|------|---------------|-------------|
| City planner | "Where is solar growing fastest?" | Investment priority map |
| Solar company | "Where are people installing panels without batteries?" | Upsell opportunity zones |
| Resilience researcher | "Which districts trust the grid least?" | Post-freeze behavior analysis |
| Real estate investor | "Where is density increasing?" | ADU growth corridors |

**Same data. Different stories. All valid.**

The insights the LLM derives are the ones that matter to *you*, not a predetermined set of visuals designed for a generic audience.

---

## Why This Matters

Traditional dashboards assume:
- Everyone wants the same metrics
- The "story" is predefined by the designer
- Exploration happens through clicking filters

Conversation-first assumes:
- The user knows what matters to them
- The story emerges from their questions
- Exploration happens through dialogue

**You don't explore a dashboard. You build a narrative.**

---

## Demo Flow

1. **Open with context**: "Austin has 2.2 million construction permits. Buried in them is the story of the city's energy transition."

2. **Show the data scale**: 2.2M permits, 6 energy signals extracted via GPU

3. **Ask a question**: "Show me where solar is growing"
   - Map updates, LLM explains the pattern

4. **Go deeper**: "Why aren't there batteries in those same areas?"
   - LLM connects solar-only to grid-tied economics

5. **Pivot perspective**: "What about generators?"
   - Reveal the post-freeze trust gap

6. **The insight**: "The same data tells different stories depending on what you're looking for"

---

## Key Talking Points

- **"Dashboards tell one story. Conversations tell yours."**
- **"The LLM is a pattern manager, not a query engine."**
- **"2.2M permits. One question at a time."**
- **"Your Austin story is unique to you."**

---

## Technical Differentiator

We're not just wrapping SQL in ChatGPT.

The pipeline:
1. **GPU extraction** (cuDF/RAPIDS) — pattern match 2.2M rows in seconds
2. **Feature signals** — solar, EV, battery, generator, panel upgrade, ADU
3. **LLM reasoning** — connects signals to meaning based on user questions
4. **Spatial context** — map visualization that updates with the narrative

The LLM adds *interpretation*, not just retrieval.

---

## One-Liner

> "Undervolt turns 2.2 million permits into your personal Austin energy story."
