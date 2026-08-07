// Derived strictly from hackathon-context/candidates.json

export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
}

export interface CandidateMission {
  day: number;
  title: string;
  passed?: boolean;
  skipped?: boolean;
  attempts?: number;
}

export interface CandidateSignals {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
}

export interface CandidateProfile {
  member: CandidateMember;
  missions: CandidateMission[];
  signals: CandidateSignals;
}

// Derived strictly from hackathon-context/curriculum.json

export interface CurriculumModule {
  n: number;
  title: string;
  days: number[];
}

export interface CurriculumDay {
  day: number;
  title: string;
  type: string;
  tools: string[];
  objectives: string[];
}

export interface Curriculum {
  cohort: string;
  modules: CurriculumModule[];
  days: CurriculumDay[];
}

// Derived strictly from hackathon-context/technical-spec.md

export interface Feedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

export interface StartInterviewRequest {
  sessionId: string;
  candidate: CandidateProfile;
}

export interface TurnInterviewRequest {
  sessionId: string;
  message: string;
}

export type InterviewRequest = StartInterviewRequest | TurnInterviewRequest;

export interface InterviewResponse {
  reply: string;
  done: boolean;
  feedback?: Feedback;
}
