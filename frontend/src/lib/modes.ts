export type Mode = 'scout' | 'investigator' | 'editor';

export interface ModeConfig {
  label: string;
  description: string;
  icon: string;
  promptModifier: string;
  questionStyle: 'broad' | 'focused' | 'narrative';
  color: string;
}

export const MODE_CONFIG: Record<Mode, ModeConfig> = {
  scout: {
    label: 'Scout',
    description: 'Surface anomalies and patterns',
    icon: 'Compass',
    promptModifier: `You are in SCOUT mode. Your job is to surface surprising patterns and anomalies.
- Cast a wide net - look for outliers, unexpected correlations
- Highlight what's "weird" or counterintuitive
- Generate broad follow-up questions that open new directions
- Use phrases like "Interesting..." "What's surprising is..." "Against expectations..."`,
    questionStyle: 'broad',
    color: 'emerald',
  },
  investigator: {
    label: 'Investigator',
    description: 'Test hypotheses and compare',
    icon: 'Search',
    promptModifier: `You are in INVESTIGATOR mode. Your job is to test hypotheses and explain causation.
- Focus on "why" questions - what drives the pattern?
- Compare cohorts: rich vs poor, east vs west, before vs after
- Be careful with causal language - show evidence, acknowledge uncertainty
- Generate focused follow-up questions that drill deeper`,
    questionStyle: 'focused',
    color: 'blue',
  },
  editor: {
    label: 'Editor',
    description: 'Shape the narrative',
    icon: 'PenTool',
    promptModifier: `You are in EDITOR mode. Your job is to help structure findings into a compelling narrative.
- Frame insights as story elements: setup, tension, resolution
- Suggest headlines, chapter structures, "what changed / why it matters / what to do"
- Connect disparate findings into a coherent arc
- Generate questions that help complete the story`,
    questionStyle: 'narrative',
    color: 'purple',
  },
};

// Guardrails that apply to ALL modes
export const GUARDRAILS = `
## Guardrails (Always Apply)

1. **Evidence-first**: Every insight must cite specific data (counts, percentages, comparisons)
2. **No mind-reading**: If user intent is unclear, offer 2-3 possible angles to explore
3. **Bias transparency**: Label when applying a lens ("Equity lens", "Cost lens", "Resilience lens")
4. **Actionable curiosity**: Always suggest what to explore next
5. **Humility**: Acknowledge data limitations and what we can't know from permits alone
`;

// Default questions for each mode when no story exists yet (28 per mode)
export const DEFAULT_QUESTIONS: Record<Mode, string[]> = {
  scout: [
    "What's the strangest pattern?",
    "Where is Austin changing fastest?",
    "What permits are exploding?",
    "Which neighborhoods are outliers?",
    "Who's building pools?",
    "Where are solar panels going?",
    "What's happening in East Austin?",
    "Which ZIP has most activity?",
    "Where's construction slowing?",
    "What's the newest trend?",
    "Which areas are over-building?",
    "What's weird about downtown?",
    "Where are ADUs popping up?",
    "What changed in 2023?",
    "Which permits are declining?",
    "Where's the renovation boom?",
    "What's happening in 78702?",
    "Where are the generators?",
    "What's District 6 building?",
    "Where's the luxury construction?",
    "What permits spike in summer?",
    "Where are EV chargers going?",
    "What's the Westlake story?",
    "Where's growth concentrated?",
    "What's the panel upgrade trend?",
    "Where are the Powerwalls?",
    "What's happening south of river?",
    "Which ZIP is transforming?",
  ],
  investigator: [
    "Why does D10 have generators?",
    "What changed after 2021 freeze?",
    "How do wealthy vs poor compare?",
    "Is solar tied to income?",
    "Why do some areas have ADUs?",
    "What drives pool construction?",
    "How does east vs west differ?",
    "Which district is resilient?",
    "What's causing panel upgrades?",
    "Is there a gentrification signal?",
    "Why are some ZIPs booming?",
    "What explains the EV gap?",
    "Does density affect solar?",
    "Why the generator disparity?",
    "What predicts renovation?",
    "How does age affect permits?",
    "Is there a climate pattern?",
    "What correlates with pools?",
    "Why the north-south divide?",
    "Does zoning affect patterns?",
    "What's the income threshold?",
    "Why 78746 vs 78744?",
    "Is backup power predictable?",
    "What drives the differences?",
    "How did COVID change things?",
    "Is there seasonal bias?",
    "What's the policy effect?",
    "Why the permit gap?",
  ],
  editor: [
    "What's the headline?",
    "Where's the tension?",
    "What surprises readers?",
    "How does this story end?",
    "What's the before and after?",
    "Who wins, who loses?",
    "What's the human angle?",
    "Where's inequality showing?",
    "What should leaders know?",
    "What's the turning point?",
    "How do these connect?",
    "What's the untold story?",
    "What's the lead paragraph?",
    "Where's the conflict?",
    "What's the resolution?",
    "Who's the protagonist?",
    "What's the setting?",
    "Where's the drama?",
    "What's the takeaway?",
    "How do we end strong?",
    "What visual tells it best?",
    "What's the nut graf?",
    "Where's the irony?",
    "What needs explaining?",
    "What's the call to action?",
    "How do we hook readers?",
    "What's the lasting image?",
    "Where's the hope?",
  ],
};
