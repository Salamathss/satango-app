export interface VocabWord {
  id: string;
  word: string;
  part_of_speech: string;
  definition: string;
  example_sentence: string;
  mnemonic?: string;
  category: string;
  tone_nuance?: string;
}

export interface ContextPassage {
  id: string;
  word_key: string; // matches VocabWord.id
  passage: string; // passage text containing [ ______ ]
  marker_words: string[]; // key context marker words/phrases to highlight
  options: {
    word: string;
    definition: string;
  }[];
  correct_index: number;
  tone_nuance: string; // Tone & Nuance explanation
}

export const VOCAB_WORDS: VocabWord[] = [
  {
    id: "substantiate",
    word: "Substantiate",
    part_of_speech: "verb",
    definition: "To provide evidence to support or prove the truth of a claim.",
    example_sentence: "The researchers provided empirical data to substantiate their groundbreaking hypothesis.",
    category: "Scientific Context",
    tone_nuance: "Formal & Scientific: Used when rigorous proof or physical evidence is required to confirm an academic claim.",
  },
  {
    id: "anomalous",
    word: "Anomalous",
    part_of_speech: "adjective",
    definition: "Deviating from what is standard, normal, or expected.",
    example_sentence: "The lab flagged the anomalous temperature reading as an outlier needing further examination.",
    category: "Scientific Context",
    tone_nuance: "Analytical & Objective: Describes data points or phenomena that break established experimental patterns.",
  },
  {
    id: "ambivalent",
    word: "Ambivalent",
    part_of_speech: "adjective",
    definition: "Having mixed, uncertain, or contradictory feelings about something.",
    example_sentence: "Scholars remain ambivalent regarding the newly discovered manuscript's authenticity.",
    category: "Tone & Attitude",
    tone_nuance: "Reflective & Nuanced: Captures dual or unresolved attitudes rather than outright hostility or enthusiasm.",
  },
  {
    id: "candid",
    word: "Candid",
    part_of_speech: "adjective",
    definition: "Truthful, unvarnished, and straightforward; frank.",
    example_sentence: "The biographer offered a candid assessment of the leader's strategic miscalculations.",
    category: "Tone & Attitude",
    tone_nuance: "Direct & Sincere: Implies honesty without diplomatic evasion or sugarcoating.",
  },
  {
    id: "corroborate",
    word: "Corroborate",
    part_of_speech: "verb",
    definition: "To confirm or give support to a statement, theory, or finding.",
    example_sentence: "Multiple independent trial results corroborate the primary laboratory's findings.",
    category: "Scientific Context",
    tone_nuance: "Academic & Verifying: Emphasizes secondary verification reinforcing existing evidence.",
  },
  {
    id: "didactic",
    word: "Didactic",
    part_of_speech: "adjective",
    definition: "Intended to teach, particularly in a moralizing or instructive manner.",
    example_sentence: "While informative, the treatise was criticized for its overtly didactic delivery.",
    category: "Tone & Attitude",
    tone_nuance: "Critical/Literary: Often carries a subtle implication of being overly preachy or instructional.",
  },
  {
    id: "ephemeral",
    word: "Ephemeral",
    part_of_speech: "adjective",
    definition: "Lasting for a very short time; fleeting.",
    example_sentence: "The artist captured the ephemeral beauty of dusk before the light vanished completely.",
    category: "Tone & Attitude",
    tone_nuance: "Poetic & Contemplative: Highlights transience and the impermanent nature of moments or trends.",
  },
  {
    id: "empirical",
    word: "Empirical",
    part_of_speech: "adjective",
    definition: "Based on observation, measurement, or experiment rather than theory alone.",
    example_sentence: "The theory requires empirical validation before it can be widely accepted in the scientific community.",
    category: "Scientific Context",
    tone_nuance: "Objective & Methodological: Connotes reliance on verifiable real-world data and structured experiments.",
  },
  {
    id: "extol",
    word: "Extol",
    part_of_speech: "verb",
    definition: "To praise enthusiastically and highly.",
    example_sentence: "Critics extolled the novel's intricate structure and haunting atmospheric prose.",
    category: "Verbs",
    tone_nuance: "Enthusiastic & Commendatory: Denotes high admiration and unreserved praise.",
  },
  {
    id: "obfuscate",
    word: "Obfuscate",
    part_of_speech: "verb",
    definition: "To render unclear, obscure, or unintelligible, often deliberately.",
    example_sentence: "Dense technical jargon should clarify concepts rather than obfuscate the core message.",
    category: "Verbs",
    tone_nuance: "Critical & Analytical: Used to describe obfuscation, confusion, or lack of intellectual transparency.",
  },
  {
    id: "pragmatic",
    word: "Pragmatic",
    part_of_speech: "adjective",
    definition: "Dealing with matters sensibly, practical rather than theoretical.",
    example_sentence: "Faced with budget limitations, the committee chose a pragmatic allocation strategy.",
    category: "Tone & Attitude",
    tone_nuance: "Realistic & Grounded: Focuses on functional utility and feasible real-world solutions.",
  },
  {
    id: "undermine",
    word: "Undermine",
    part_of_speech: "verb",
    definition: "To lessen the effectiveness, power, or credibility of gradually or insidiously.",
    example_sentence: "Flawed methodology can inadvertently undermine even the most promising study.",
    category: "Verbs",
    tone_nuance: "Subtle & Destructive: Implies gradual weakening from within rather than a direct sudden assault.",
  }
];

export const CONTEXT_PASSAGES: ContextPassage[] = [
  {
    id: "pass_substantiate",
    word_key: "substantiate",
    passage: "Although Dr. Vance presented a bold theoretical framework regarding deep-sea thermal currents, her peers noted that without rigorous field observations to [ ______ ] her claims, the hypothesis remains largely speculative.",
    marker_words: ["theoretical framework", "without rigorous field observations", "claims", "speculative"],
    options: [
      { word: "substantiate", definition: "To support or prove with evidence" },
      { word: "obfuscate", definition: "To make unclear or obscure" },
      { word: "undermine", definition: "To weaken gradually" },
      { word: "extol", definition: "To praise highly" },
    ],
    correct_index: 0,
    tone_nuance: "The passage sets up a contrast between a 'theoretical framework' and 'rigorous field observations'. The tone is formal and academic. The blank requires a verb meaning to back up or validate claims with concrete evidence. 'Substantiate' precisely fits this evidentiary requirement."
  },
  {
    id: "pass_anomalous",
    word_key: "anomalous",
    passage: "During the five-year climate audit, meterologists recorded steady seasonal temperatures across all stations except for one [ ______ ] data set in July that registered a sudden 15-degree drop unaccounted for by regional patterns.",
    marker_words: ["steady seasonal temperatures", "except for one", "sudden 15-degree drop", "unaccounted for"],
    options: [
      { word: "pragmatic", definition: "Practical and sensible" },
      { word: "anomalous", definition: "Deviating from what is normal or expected" },
      { word: "candid", definition: "Frank and straightforward" },
      { word: "didactic", definition: "Instructive or preachy" },
    ],
    correct_index: 1,
    tone_nuance: "The context markers 'steady seasonal temperatures' and 'except for one... unaccounted for' indicate a deviation from expected norms. An analytical tone calls for 'anomalous', which directly describes irregular or outlier data."
  },
  {
    id: "pass_ambivalent",
    word_key: "ambivalent",
    passage: "Historians remain distinctly [ ______ ] about the treaty: while it undeniably brought an immediate end to border hostilities, it simultaneously sowed the seeds for long-term economic instability in the province.",
    marker_words: ["while it undeniably brought", "end to border hostilities", "simultaneously sowed the seeds", "instability"],
    options: [
      { word: "ephemeral", definition: "Fleeting; short-lived" },
      { word: "didactic", definition: "Intended to teach morals" },
      { word: "ambivalent", definition: "Having mixed or conflicting feelings" },
      { word: "candid", definition: "Outspoken and frank" },
    ],
    correct_index: 2,
    tone_nuance: "The structure contrasts a positive outcome ('end to border hostilities') with a negative one ('instability'). This duality requires an adjective describing mixed evaluation. 'Ambivalent' perfectly captures having conflicting assessments."
  },
  {
    id: "pass_corroborate",
    word_key: "corroborate",
    passage: "The archeological team hesitated to publish their findings until carbon-dating tests performed by an independent laboratory could [ ______ ] the artifact's estimated 3,000-year age.",
    marker_words: ["hesitated to publish", "until carbon-dating tests", "independent laboratory", "could"],
    options: [
      { word: "undermine", definition: "To weaken or ruin" },
      { word: "corroborate", definition: "To confirm or verify independently" },
      { word: "obfuscate", definition: "To confuse or blur" },
      { word: "extol", definition: "To glorify or praise" },
    ],
    correct_index: 1,
    tone_nuance: "The passage emphasizes caution ('hesitated to publish until...') and independent verification. 'Corroborate' expresses the action of an independent source confirming preliminary findings."
  },
  {
    id: "pass_ephemeral",
    word_key: "ephemeral",
    passage: "Modern social media trends often display an [ ______ ] lifecycle, flaring into immense popularity across millions of feeds before vanishing from public discourse within a matter of days.",
    marker_words: ["flaring into immense popularity", "before vanishing", "within a matter of days"],
    options: [
      { word: "empirical", definition: "Based on experiment or observation" },
      { word: "ephemeral", definition: "Transient, short-lived" },
      { word: "pragmatic", definition: "Focusing on practical results" },
      { word: "substantiate", definition: "To supply evidence for" },
    ],
    correct_index: 1,
    tone_nuance: "The key phrases 'flaring... before vanishing... within a matter of days' describe brief duration. 'Ephemeral' is the exact SAT term for transient, short-lived phenomena."
  },
  {
    id: "pass_obfuscate",
    word_key: "obfuscate",
    passage: "Critics argued that the financial report was crafted deliberately to [ ______ ] the company's escalating debt burdens behind layers of dense accounting terminology.",
    marker_words: ["crafted deliberately to", "behind layers of dense accounting terminology", "debt burdens"],
    options: [
      { word: "obfuscate", definition: "To intentionally confuse or conceal" },
      { word: "corroborate", definition: "To confirm with evidence" },
      { word: "extol", definition: "To praise enthusiastically" },
      { word: "candid", definition: "Honest and plain-spoken" },
    ],
    correct_index: 0,
    tone_nuance: "The phrase 'behind layers of dense accounting terminology' signifies hiding or masking truth. 'Obfuscate' specifically means making something obscure or confusing to prevent clear understanding."
  },
  {
    id: "pass_pragmatic",
    word_key: "pragmatic",
    passage: "Faced with dwindling municipal funds, the mayor adopted a [ ______ ] stance, prioritizing essential utility repairs over ambitious cultural center renovations.",
    marker_words: ["dwindling municipal funds", "prioritizing essential utility repairs", "over ambitious"],
    options: [
      { word: "didactic", definition: "Morally instructive" },
      { word: "anomalous", definition: "Irregular or unusual" },
      { word: "pragmatic", definition: "Practical and realistic" },
      { word: "ephemeral", definition: "Fleeting and temporary" },
    ],
    correct_index: 2,
    tone_nuance: "Choosing basic utilities over grand cultural ambitions due to limited money shows practical decision-making. 'Pragmatic' describes realistic problem solving focused on immediate function."
  },
  {
    id: "pass_undermine",
    word_key: "undermine",
    passage: "Publishing unverified statistical assertions in an academic journal risks spreading misinformation, which can severely [ ______ ] public confidence in scientific research.",
    marker_words: ["unverified statistical assertions", "spreading misinformation", "severely", "public confidence"],
    options: [
      { word: "undermine", definition: "To weaken or sabotage gradually" },
      { word: "substantiate", definition: "To prove true with facts" },
      { word: "extol", definition: "To praise publicly" },
      { word: "corroborate", definition: "To back up a claim" },
    ],
    correct_index: 0,
    tone_nuance: "The passage warns against negative consequences of unverified claims on public trust. The blank requires a verb meaning to erode or weaken trust—making 'undermine' the correct choice."
  }
];

export const getVocabWord = (key: string): VocabWord | undefined => {
  return VOCAB_WORDS.find((w) => w.id === key);
};
