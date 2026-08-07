import type { CandidateProfile, CurriculumDay, CurriculumModule } from "./index";

export type CompetencyLevel =
  | "STRONG"
  | "SATISFACTORY"
  | "NEEDS_IMPROVEMENT"
  | "SKIPPED"
  | "UNATTEMPTED";

export interface DayPerformance {
  day: number;
  title: string;
  moduleN: number;
  moduleTitle: string;
  status: CompetencyLevel;
  attempts: number;
  tools: string[];
  objectives: string[];
}

export interface ModulePerformance {
  moduleN: number;
  title: string;
  daysTotal: number;
  daysPassed: number;
  daysSkipped: number;
  daysFailed: number;
  competencyScore: number; // 0 to 100 percentage
  status: "STRONG" | "MODERATE" | "WEAK" | "UNTESTED";
}

export type ProbingReason =
  | "FAILED_MISSION"
  | "SKIPPED_MISSION"
  | "HIGH_ATTEMPTS"
  | "UNATTEMPTED_CORE"
  | "ROLE_ALIGNMENT";

export interface ProbingRecommendation {
  day: number;
  topicTitle: string;
  moduleTitle: string;
  reason: ProbingReason;
  priority: "HIGH" | "MEDIUM" | "LOW";
  suggestedFocus: string;
}

export interface CandidateInterviewProfile {
  candidateId: string;
  candidateName: string;
  jobRole: string;
  yearsExperience: number;
  education: string;

  metrics: {
    commitConsistencyRatio: number;
    completionRate: number;
    firstTrySuccessRate: number;
    totalPassedDays: number;
    totalFailedDays: number;
    totalSkippedDays: number;
    totalRepeatedAttemptDays: number;
  };

  strongDays: number[];
  struggledDays: number[];
  skippedDays: number[];
  failedDays: number[];

  dayPerformanceMap: Record<number, DayPerformance>;
  modulePerformanceList: ModulePerformance[];
  recommendedProbingAreas: ProbingRecommendation[];

  executiveSummary: string;
}
