// 12 topic-based categories
export type Category =
  | 'solar'
  | 'battery'
  | 'generators'
  | 'ev'
  | 'resilience'
  | 'growth'
  | 'equity'
  | 'districts'
  | 'pools'
  | 'adu'
  | 'demolition'
  | 'eastwest';

export interface CategoryConfig {
  label: string;
  description: string;
  color: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  solar: { label: 'Solar', description: 'Solar panel installations across Austin', color: 'amber' },
  battery: { label: 'Battery Storage', description: 'Battery and energy storage systems', color: 'blue' },
  generators: { label: 'Generators', description: 'Backup generator installations', color: 'red' },
  ev: { label: 'EV Chargers', description: 'Electric vehicle charging infrastructure', color: 'green' },
  resilience: { label: 'Resilience', description: 'Grid preparedness and backup power', color: 'orange' },
  growth: { label: 'Growth Trends', description: 'Construction growth from 2000-2026', color: 'emerald' },
  equity: { label: 'Equity', description: 'Income and access disparities', color: 'purple' },
  districts: { label: 'Districts', description: 'Council district comparisons', color: 'cyan' },
  pools: { label: 'Pools & Luxury', description: 'High-end construction and amenities', color: 'pink' },
  adu: { label: 'ADUs', description: 'Accessory dwelling units and density', color: 'indigo' },
  demolition: { label: 'Demolition', description: 'Teardowns and redevelopment', color: 'rose' },
  eastwest: { label: 'East vs West', description: 'Geographic divide in Austin', color: 'teal' },
};

// Legacy mode type for backward compatibility
export type Mode = 'scout' | 'investigator' | 'editor';

export const MODE_CONFIG: Record<Mode, { label: string; description: string; icon: string; promptModifier: string; questionStyle: string; color: string }> = {
  scout: { label: 'Scout', description: 'Surface anomalies', icon: 'Compass', promptModifier: '', questionStyle: 'broad', color: 'emerald' },
  investigator: { label: 'Investigator', description: 'Test hypotheses', icon: 'Search', promptModifier: '', questionStyle: 'focused', color: 'blue' },
  editor: { label: 'Editor', description: 'Shape narrative', icon: 'PenTool', promptModifier: '', questionStyle: 'narrative', color: 'purple' },
};

export const GUARDRAILS = `
## Guardrails (Always Apply)
1. **Evidence-first**: Every insight must cite specific data
2. **No mind-reading**: If user intent is unclear, offer angles to explore
3. **Humility**: Acknowledge data limitations
`;

// 12 categories × 6 questions = 72 pre-cached questions
// Questions cover Austin permit data from 2000-2026
export const CATEGORY_QUESTIONS: Record<Category, string[]> = {
  solar: [
    "How has solar adoption grown since 2000?",
    "Which ZIP codes lead in solar installations?",
    "Why did solar permits peak in 2023 then decline?",
    "What's the average solar system size in Austin?",
    "How much total solar capacity has Austin installed?",
    "Where are the solar deserts in Austin?",
  ],
  battery: [
    "Why is there only 1 battery for every 22 solar installs?",
    "Which neighborhoods lead in battery storage?",
    "How has battery adoption changed since 2020?",
    "Where's the biggest solar-to-battery gap?",
    "What's driving battery storage growth in Austin?",
    "Which ZIPs pair solar with battery storage?",
  ],
  generators: [
    "How did generator permits spike after the 2021 freeze?",
    "Which ZIP codes have the most generators?",
    "How have generator permits trended from 2000 to 2026?",
    "Why does Westlake have 5x more generators than East Austin?",
    "What's the total number of backup generators in Austin?",
    "Did generator demand stay elevated after 2021?",
  ],
  ev: [
    "Where are EV chargers being installed in Austin?",
    "How has EV charger growth changed since 2020?",
    "Which areas are EV charging deserts?",
    "How do EV charger installs compare east vs west?",
    "What's the EV charger trend from 2015 to 2026?",
    "Which ZIP has the most EV infrastructure?",
  ],
  resilience: [
    "Which districts are most prepared for grid failure?",
    "How did Winter Storm Uri change Austin's infrastructure?",
    "What's the backup power divide in Austin?",
    "How has resilience investment grown since 2000?",
    "Which neighborhoods are most grid-vulnerable?",
    "How does income predict grid preparedness?",
  ],
  growth: [
    "How has total construction changed from 2000 to 2026?",
    "Which permit categories are growing fastest?",
    "What's the demolition growth rate since 2015?",
    "Where is new construction concentrated in Austin?",
    "How did COVID affect Austin construction permits?",
    "What are the biggest construction trends in 2024-2026?",
  ],
  equity: [
    "How does income correlate with energy infrastructure?",
    "Is there an energy equity gap in Austin?",
    "Which communities have the least resilience investment?",
    "How does the wealth divide show up in permits?",
    "What's the solar access gap between rich and poor ZIPs?",
    "Where are gentrification signals strongest?",
  ],
  districts: [
    "How does District 10 compare to District 1 in permits?",
    "Which council district has the most energy permits?",
    "What are the biggest disparities between districts?",
    "How has each district's construction changed since 2000?",
    "Which district leads in renewable energy adoption?",
    "What's the permit activity ranking by district?",
  ],
  pools: [
    "Where are pool permits concentrated in Austin?",
    "How has luxury construction trended since 2000?",
    "Which ZIPs have the most high-value renovations?",
    "What's the pool permit trend from 2010 to 2026?",
    "Where is renovation spending highest in Austin?",
    "How do pool permits map to income levels?",
  ],
  adu: [
    "How have ADU permits grown since zoning changes?",
    "Which neighborhoods lead in ADU construction?",
    "What's the ADU growth rate from 2018 to 2026?",
    "Where are ADUs concentrated in Austin?",
    "How did policy changes affect ADU construction?",
    "Which ZIPs have the most ADU activity?",
  ],
  demolition: [
    "Why has demolition grown 547% in Austin?",
    "Which areas are seeing the most teardowns?",
    "How has demolition trended from 2000 to 2026?",
    "Where are teardowns replacing old homes?",
    "What's driving the demolition boom since 2015?",
    "Which ZIPs lead in demolition permits?",
  ],
  eastwest: [
    "How does East Austin compare to West Austin in permits?",
    "What's the energy infrastructure divide east vs west?",
    "How has the east-west gap changed since 2000?",
    "Where does East Austin lead in construction activity?",
    "What's driving the north-south construction divide?",
    "How do east and west compare in solar adoption?",
  ],
};

// Flat list of all questions for caching
export function getAllQuestions(): string[] {
  return Object.values(CATEGORY_QUESTIONS).flat();
}

// Legacy DEFAULT_QUESTIONS for backward compatibility
export const DEFAULT_QUESTIONS: Record<Mode, string[]> = {
  scout: [
    ...CATEGORY_QUESTIONS.solar.slice(0, 2),
    ...CATEGORY_QUESTIONS.generators.slice(0, 2),
    ...CATEGORY_QUESTIONS.growth.slice(0, 2),
  ],
  investigator: [
    ...CATEGORY_QUESTIONS.resilience.slice(0, 2),
    ...CATEGORY_QUESTIONS.equity.slice(0, 2),
    ...CATEGORY_QUESTIONS.eastwest.slice(0, 2),
  ],
  editor: [
    ...CATEGORY_QUESTIONS.demolition.slice(0, 2),
    ...CATEGORY_QUESTIONS.ev.slice(0, 2),
    ...CATEGORY_QUESTIONS.pools.slice(0, 2),
  ],
};
