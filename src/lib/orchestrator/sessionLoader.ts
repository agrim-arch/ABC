import { createClient } from "@/lib/supabase/server";
import type { DbInterviewSession, DbInterviewMessage, DbInterviewEvaluation } from "@/types";

export interface FullSessionState {
  session: DbInterviewSession | null;
  messages: DbInterviewMessage[];
  evaluations: DbInterviewEvaluation[];
}

/**
 * Retrieves full interview session state from Supabase by sessionId.
 */
export async function getInterviewSessionState(sessionId: string): Promise<FullSessionState> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!session) {
    return { session: null, messages: [], evaluations: [] };
  }

  const { data: messages } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_number", { ascending: true });

  const { data: evaluations } = await supabase
    .from("interview_evaluations")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return {
    session: session as DbInterviewSession,
    messages: (messages as DbInterviewMessage[]) || [],
    evaluations: (evaluations as DbInterviewEvaluation[]) || [],
  };
}
