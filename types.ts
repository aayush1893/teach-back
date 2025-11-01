export interface QAItem {
  q: string;
  a_correct: string;
  a_distractors: string[];
  rationale_correct: string;
  rationale_incorrect: string;
  concept_tag?: string; // Optional concept tag for categorization
}

export interface Remediation {
  if_wrong: string;
  examples: string[];
}

export interface SafetyFlags {
  urgent_contact: boolean;
  contraindication_mentioned: boolean;
  red_flags: string[];
}

// --- NEW: Classification and Context Types ---

export type Context = 'prescription' | 'eob' | 'prior_auth' | 'discharge' | 'lab' | 'unknown';

export const SELECTABLE_CONTEXTS: Exclude<Context, 'unknown'>[] = ['prescription', 'eob', 'prior_auth', 'discharge', 'lab'];

export interface ClassificationResult {
  context: Context;
  confidence: number;
  top_k: {
    label: Exclude<Context, 'unknown'>;
    score: number;
  }[];
  unknown_reasons: string[];
}

// --- NEW: Domain-Specific Data Structures ---

export interface PrescriptionDomain {
  dose: string;
  route: string;
  frequency: string;
  timing: string;
  missed_dose_instructions: string;
  common_side_effects: string[];
  interaction_warnings: string[];
}

export interface EobDomain {
  claim_id: string;
  service_date: string;
  billed: string;
  allowed: string;
  deductible: string;
  copay: string;
  coinsurance: string;
  not_covered_reason: string;
  appeal_window_days: number;
  next_steps: string[];
}

export interface PriorAuthDomain {
  status: string;
  missing_items: string[];
  clinical_criteria: string[];
  deadline: string;
  checklist: string[];
  template_addendum: string;
}

export interface DischargeDomain {
  followups: string[];
  med_changes: string[];
  when_to_call: string[];
  activity_restrictions: string[];
}

export interface LabDomain {
  test: string;
  value: string;
  unit: string;
  reference_range: string;
  interpretation: string;
  next_steps: string[];
}

export interface UnknownDomain {
  key_points: string[];
  action_checklist: string[];
  questions_to_ask_provider: string[];
}

// --- UPDATED: Main Data Structure ---

export interface TeachBackData {
  context: Context;
  simplified_text: string;
  reading_grade_after: number;
  qa: QAItem[];
  remediation: Remediation;
  safety_flags: SafetyFlags;
  domain: {
    prescription?: PrescriptionDomain;
    eob?: EobDomain;
    prior_auth?: PriorAuthDomain;
    discharge?: DischargeDomain;
    lab?: LabDomain;
    unknown?: UnknownDomain;
  };
}


// --- App State & Session Types ---

export enum QuizState {
  NotStarted = 'NOT_STARTED',
  InProgress = 'IN_PROGRESS',
  Submitted = 'SUBMITTED',
  Mastered = 'MASTERED',
}

export type UserAnswers = Record<number, string>;

export interface SessionMetrics {
  attempts: number;
  masteryTime: number | null;
  readingGradeAfter: number | null; // Updated name
}

export interface SavedSessionState {
  inputText: string;
  classificationResult: ClassificationResult; // Added
  generatedContent: TeachBackData;
  quizState: QuizState;
  userAnswers: UserAnswers;
  sessionMetrics: SessionMetrics;
  elapsedTime: number;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  definition?: GlossaryTerm;
}

// --- NEW: Feedback Type ---
export interface FeedbackData {
    rating: number;
    accuracy: 'very_accurate' | 'mostly_accurate' | 'somewhat_accurate' | 'not_accurate' | '';
    helpfulness: 'very_helpful' | 'somewhat_helpful' | 'not_helpful' | '';
    features: string[];
    comment: string;
}

// Translation and TTS Types (Unchanged)
export type Language = 'en' | 'es' | 'fr' | 'de' | 'hi';

export const SUPPORTED_LANGUAGES: { code: Language, name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
];

export const LANGUAGE_VOICE_MAP: Record<Language, string> = {
    'en': 'Zephyr',
    'es': 'Puck',
    'fr': 'Charon',
    'de': 'Fenrir',
    'hi': 'Kore',
};