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

// 12 categories × 8 questions = 96 pre-cached questions
// Questions cover Austin permit data from 2000-2026
export const CATEGORY_QUESTIONS: Record<Category, string[]> = {
  solar: [
    "How has solar adoption grown since 2000?",
    "Which ZIP codes lead in solar installations?",
    "How did solar installations in 2024 compare to the 2023 peak?",
    "Is Austin's solar boom slowing down in 2025?",
    "How much total solar capacity has Austin installed?",
    "Where are the solar deserts in Austin?",
    "How does Austin's solar ranking compare to other Texas cities?",
    "Which ZIP added the most solar in the last 2 years?",
  ],
  battery: [
    "Why is there only 1 battery for every 9 solar installs?",
    "Which neighborhoods lead in battery storage?",
    "Did battery adoption accelerate from 2023 to 2025?",
    "Where's the biggest solar-to-battery gap?",
    "Why aren't more solar homes adding batteries?",
    "Which ZIPs pair solar with battery storage?",
    "How does Austin's battery adoption compare to its solar growth?",
    "What incentives exist for Austin battery storage adoption?",
  ],
  generators: [
    "How did generator permits spike after the 2021 freeze?",
    "Which ZIP codes have the most generators?",
    "Are generators still selling faster in 2025 than before the freeze?",
    "Why does Westlake have 5x more generators than East Austin?",
    "What's the total number of backup generators in Austin?",
    "How does 2024 generator demand compare to the 2021 peak?",
    "Could batteries replace generators as the go-to backup power?",
    "What does a typical Austin generator installation cost?",
  ],
  ev: [
    "Where are EV chargers being installed in Austin?",
    "Did EV charger growth accelerate from 2023 to 2025?",
    "Which areas are EV charging deserts?",
    "How do EV charger installs compare east vs west?",
    "Is Austin keeping up with EV adoption rates?",
    "Which ZIP has the most EV infrastructure?",
    "How many registered EVs per charger are there in Austin?",
    "Where should Austin build EV chargers next?",
  ],
  resilience: [
    "Which districts are most prepared for grid failure?",
    "How did Winter Storm Uri change Austin's infrastructure?",
    "What's the backup power divide in Austin?",
    "Is Austin more grid-resilient now than it was in 2021?",
    "Which neighborhoods are most grid-vulnerable?",
    "How much has backup power investment grown from 2022 to 2025?",
    "How has Austin Energy's grid spending changed since Uri?",
    "Which ZIP codes still have zero backup power?",
  ],
  growth: [
    "How has total construction changed from 2000 to 2026?",
    "Which permit categories are growing fastest?",
    "How did 2024 construction compare to the 2020 COVID dip?",
    "Where is new construction concentrated in Austin?",
    "How did COVID affect Austin construction permits?",
    "What's the hottest construction category in 2025?",
    "Where does Austin rank nationally in building permits?",
    "How did Austin's 2024 permits compare to the long-term average?",
  ],
  equity: [
    "How does income correlate with energy infrastructure?",
    "Is there an energy equity gap in Austin?",
    "Which communities have the least resilience investment?",
    "Is the energy equity gap getting wider or narrower?",
    "What's the solar access gap between rich and poor ZIPs?",
    "How much more backup power does Westlake have than East Austin?",
    "How much do low-income Texans spend on energy vs wealthy households?",
    "Which ZIP codes show the biggest gap between income and infrastructure?",
  ],
  districts: [
    "How does District 10 compare to District 1 in permits?",
    "Which council district has the most energy permits?",
    "What are the biggest disparities between districts?",
    "Which district saw the biggest permit jump from 2023 to 2025?",
    "Which district leads in renewable energy adoption?",
    "How does District 6 compare to District 3 in clean energy?",
    "Which district is falling behind in energy infrastructure?",
    "What's the per-capita permit gap between the richest and poorest districts?",
  ],
  pools: [
    "Where are pool permits concentrated in Austin?",
    "Did luxury construction bounce back after the 2020 COVID dip?",
    "Which ZIPs have the most high-value renovations?",
    "What's the pool permit trend from 2010 to 2026?",
    "How does 78746 compare to 78702 in luxury permits?",
    "How do pool permits map to income levels?",
    "How many pool permits did Austin issue in 2024?",
    "What share of Austin's total permits are luxury or high-end?",
  ],
  adu: [
    "How have ADU permits grown since zoning changes?",
    "Which neighborhoods lead in ADU construction?",
    "How did the 2023 HOME Initiative change ADU construction?",
    "Where are ADUs concentrated in Austin?",
    "Are ADUs actually increasing housing density in Austin?",
    "Which ZIPs have the most ADU activity?",
    "How do ADU permits in 2025 compare to pre-HOME Initiative levels?",
    "How many HOME Initiative ADU applications have been submitted?",
  ],
  demolition: [
    "Why has demolition grown 547% in Austin?",
    "Which areas are seeing the most teardowns?",
    "How do 2024 demolitions compare to 2015 levels?",
    "Where are teardowns replacing old homes?",
    "Is demolition accelerating in East Austin neighborhoods?",
    "Which ZIPs lead in demolition permits?",
    "Is demolition a leading indicator of gentrification in Austin?",
    "How did demolition permits change after the HOME Initiative?",
  ],
  eastwest: [
    "How does East Austin compare to West Austin in permits?",
    "What's the energy infrastructure divide east vs west?",
    "Is the east-west energy gap closing or widening since 2020?",
    "Where does East Austin lead in construction activity?",
    "How does 78746 Westlake compare to 78702 East Austin?",
    "How do east and west compare in solar adoption?",
    "What would equal energy access look like across Austin?",
    "Which east side ZIP has closed the infrastructure gap the most?",
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
