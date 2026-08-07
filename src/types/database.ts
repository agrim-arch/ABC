import type { CandidateProfile } from "./index";

export type SessionStatus = "INITIALIZED" | "IN_PROGRESS" | "COMPLETED";

export interface DbInterviewSession {
  id: string;
  session_id: string;
  candidate_id: string;
  candidate_name: string;
  job_role: string;
  candidate_snapshot: CandidateProfile;
  status: SessionStatus;
  current_turn: number;
  covered_days: number[];
  current_focus_day: number | null;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "system" | "assistant" | "user";

export interface DbInterviewMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  turn_number: number;
  created_at: string;
}

export type QuestionType =
  | "conceptual"
  | "application"
  | "debugging"
  | "system_design"
  | "follow_up";

export interface DbInterviewEvaluation {
  id: string;
  session_id: string;
  day: number;
  question_text: string;
  question_type: QuestionType | null;
  candidate_answer: string | null;
  score: number | null;
  evaluation_notes: string | null;
  created_at: string;
}

export interface DbInterviewFeedback {
  id: string;
  session_id: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  next_steps: string[];
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      interview_sessions: {
        Row: DbInterviewSession;
        Insert: Omit<DbInterviewSession, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DbInterviewSession>;
      };
      interview_messages: {
        Row: DbInterviewMessage;
        Insert: Omit<DbInterviewMessage, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<DbInterviewMessage>;
      };
      interview_evaluations: {
        Row: DbInterviewEvaluation;
        Insert: Omit<DbInterviewEvaluation, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<DbInterviewEvaluation>;
      };
      interview_feedback: {
        Row: DbInterviewFeedback;
        Insert: Omit<DbInterviewFeedback, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<DbInterviewFeedback>;
      };
    };
  };
}
