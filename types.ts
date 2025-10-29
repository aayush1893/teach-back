export interface QAItem {
  q: string;
  a_correct: string;
  a_distractors: string[];
  rationale_correct: string;
  rationale_incorrect: string;
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

export interface TeachBackData {
  simplified_text: string;
  reading_grade: number;
  qa: QAItem[];
  remediation: Remediation;
  safety_flags: SafetyFlags;
}

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
  readingGrade: number | null;
}

export interface SavedSessionState {
  inputText: string;
  generatedContent: TeachBackData;
  quizState: QuizState;
  userAnswers: UserAnswers;
  sessionMetrics: SessionMetrics;
  elapsedTime: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// New types for Translation and TTS
export type Language = 'en' | 'es' | 'fr' | 'de' | 'hi';

export const SUPPORTED_LANGUAGES: { code: Language, name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
];

// Maps language codes to available Gemini TTS prebuilt voices
export const LANGUAGE_VOICE_MAP: Record<Language, string> = {
    'en': 'Zephyr', // English
    'es': 'Puck',   // Spanish
    'fr': 'Charon', // French
    'de': 'Fenrir', // German
    'hi': 'Kore',   // Hindi (using a versatile voice)
};
