import type { QuestionType, DbInterviewSession, DbInterviewEvaluation } from "./database";
import type { CandidateInterviewProfile } from "./intelligence";

export type InterviewStage =
  | "BASELINE"
  | "TARGETED_DIAGNOSTIC"
  | "ADAPTIVE_DEPTH"
  | "SYSTEM_APPLICATION"
  | "WRAP_UP";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export type AnswerQuality = "STRONG" | "PARTIALLY_CORRECT" | "WEAK" | "UNCERTAIN";

export type AdaptiveAction =
  | "ADVANCE_TOPIC"
  | "DEEPEN_DIFFICULTY"
  | "FOLLOW_UP_MISSING_CONCEPT"
  | "DIAGNOSE_WEAKNESS"
  | "WRAP_UP_INTERVIEW";

export interface NextQuestionPlan {
  sessionId: string;
  currentTurn: number;
  stage: InterviewStage;
  targetDay: number;
  targetModuleN: number;
  targetModuleTitle: string;
  targetTopicTitle: string;
  targetTools: string[];
  targetObjectives: string[];
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  isFollowUp: boolean;
  adaptiveAction: AdaptiveAction;
  selectionReason: string;
  triggeringEvidence: string;
  coveredDaysSoFar: number[];
  questionsAskedCount: number;
  isMinimumRequirementsMet: boolean;
  shouldEndInterview: boolean;
}

export interface OrchestratorInput {
  candidateProfile: CandidateInterviewProfile;
  session: DbInterviewSession;
  evaluations: DbInterviewEvaluation[];
  lastCandidateAnswer?: {
    text: string;
    score?: number; // 1 to 5
    quality?: AnswerQuality;
  };
}
