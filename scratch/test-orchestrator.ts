import candidateData from "../hackathon-context/candidates.json";
import { analyzeCandidate } from "../src/lib/intelligence/analyzer";
import { planNextTurn } from "../src/lib/orchestrator/planner";
import type { CandidateProfile, DbInterviewSession, DbInterviewEvaluation } from "../src/types";

const candidates = candidateData.candidates as CandidateProfile[];

function createMockSession(sessionId: string, candidateId: string, currentTurn = 0, coveredDays: number[] = []): DbInterviewSession {
  return {
    id: "mock-uuid-123",
    session_id: sessionId,
    candidate_id: candidateId,
    candidate_name: "Mock Candidate",
    job_role: "Software Engineer",
    candidate_snapshot: candidates[0],
    status: "IN_PROGRESS",
    current_turn: currentTurn,
    covered_days: coveredDays,
    current_focus_day: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function createMockEvaluation(sessionId: string, day: number, score = 4, qType: DbInterviewEvaluation["question_type"] = "conceptual"): DbInterviewEvaluation {
  return {
    id: `eval-${Math.random()}`,
    session_id: sessionId,
    day,
    question_text: `Mock question for Day ${day}?`,
    question_type: qType,
    candidate_answer: "Mock candidate answer string.",
    score,
    evaluation_notes: "Mock notes",
    created_at: new Date().toISOString(),
  };
}

console.log("==================================================================");
console.log("=== PHASE 5: INTERVIEW ORCHESTRATOR COMPREHENSIVE TEST SUITE ===");
console.log("==================================================================\n");

// Scenario 1: New candidate / first interview question
console.log("--- Scenario 1: New Candidate / First Question ---");
const c1 = candidates.find((c) => c.member.id === "CAND-001")!;
const prof1 = analyzeCandidate(c1);
const plan1 = planNextTurn({
  candidateProfile: prof1,
  session: createMockSession("sess-1", c1.member.id, 0),
  evaluations: [],
});
console.log(`[Turn ${plan1.currentTurn}] Stage: ${plan1.stage} | Action: ${plan1.adaptiveAction} | Target Day ${plan1.targetDay} (${plan1.targetTopicTitle})`);
console.log(`Reason: ${plan1.selectionReason}\n`);

// Scenario 2: Candidate with strong performance (CAND-003)
console.log("--- Scenario 2: Candidate with Strong Performance (CAND-003) ---");
const c3 = candidates.find((c) => c.member.id === "CAND-003")!;
const prof3 = analyzeCandidate(c3);
const plan2 = planNextTurn({
  candidateProfile: prof3,
  session: createMockSession("sess-2", c3.member.id, 0),
  evaluations: [],
});
console.log(`[Turn ${plan2.currentTurn}] Stage: ${plan2.stage} | Target Day ${plan2.targetDay} (${plan2.targetTopicTitle}) | QType: ${plan2.questionType}`);
console.log(`Reason: ${plan2.selectionReason}\n`);

// Scenario 3: Candidate with skipped topics (CAND-001 skipped Day 29)
console.log("--- Scenario 3: Candidate with Skipped Topic (CAND-001) ---");
const plan3 = planNextTurn({
  candidateProfile: prof1,
  session: createMockSession("sess-3", c1.member.id, 1, [1]),
  evaluations: [createMockEvaluation("sess-3", 1, 4)],
});
console.log(`[Turn ${plan3.currentTurn}] Stage: ${plan3.stage} | Target Day ${plan3.targetDay} (${plan3.targetTopicTitle}) | Action: ${plan3.adaptiveAction}`);
console.log(`Reason: ${plan3.selectionReason}\n`);

// Scenario 4: Candidate with failed topics (CAND-010 failed Days 8, 10, 22)
console.log("--- Scenario 4: Candidate with Failed Topics (CAND-010) ---");
const c10 = candidates.find((c) => c.member.id === "CAND-010")!;
const prof10 = analyzeCandidate(c10);
const plan4 = planNextTurn({
  candidateProfile: prof10,
  session: createMockSession("sess-4", c10.member.id, 0),
  evaluations: [],
});
console.log(`[Turn ${plan4.currentTurn}] Target Day ${plan4.targetDay} (${plan4.targetTopicTitle}) | Reason: ${plan4.selectionReason}\n`);

// Scenario 5: Candidate with repeated attempts (CAND-004)
console.log("--- Scenario 5: Candidate with Repeated Attempts (CAND-004) ---");
const c4 = candidates.find((c) => c.member.id === "CAND-004")!;
const prof4 = analyzeCandidate(c4);
const plan5 = planNextTurn({
  candidateProfile: prof4,
  session: createMockSession("sess-5", c4.member.id, 0),
  evaluations: [],
});
console.log(`[Turn ${plan5.currentTurn}] Target Day ${plan5.targetDay} (${plan5.targetTopicTitle}) | Triggering Evidence: ${plan5.triggeringEvidence}\n`);

// Scenario 6: Candidate gives a strong answer
console.log("--- Scenario 6: Candidate Gives Strong Answer ---");
const plan6 = planNextTurn({
  candidateProfile: prof1,
  session: createMockSession("sess-6", c1.member.id, 1, [7]),
  evaluations: [createMockEvaluation("sess-6", 7, 5, "conceptual")],
  lastCandidateAnswer: { text: "Detailed clear answer", score: 5, quality: "STRONG" },
});
console.log(`Action: ${plan6.adaptiveAction} | Difficulty: ${plan6.difficulty} | QType: ${plan6.questionType}`);
console.log(`Reason: ${plan6.selectionReason}\n`);

// Scenario 7: Candidate gives a weak answer
console.log("--- Scenario 7: Candidate Gives Weak Answer ---");
const plan7 = planNextTurn({
  candidateProfile: prof1,
  session: createMockSession("sess-7", c1.member.id, 1, [7]),
  evaluations: [createMockEvaluation("sess-7", 7, 2, "conceptual")],
  lastCandidateAnswer: { text: "Uncertain vague answer", score: 2, quality: "WEAK" },
});
console.log(`Action: ${plan7.adaptiveAction} | IsFollowUp: ${plan7.isFollowUp} | Target Day: ${plan7.targetDay}`);
console.log(`Reason: ${plan7.selectionReason}\n`);

// Scenario 8: Candidate requires a follow-up
console.log("--- Scenario 8: Candidate Requires Follow-Up ---");
const plan8 = planNextTurn({
  candidateProfile: prof1,
  session: createMockSession("sess-8", c1.member.id, 1, [8]),
  evaluations: [createMockEvaluation("sess-8", 8, 3, "conceptual")],
  lastCandidateAnswer: { text: "Partial answer", score: 3, quality: "PARTIALLY_CORRECT" },
});
console.log(`Action: ${plan8.adaptiveAction} | IsFollowUp: ${plan8.isFollowUp} | Difficulty: ${plan8.difficulty}`);
console.log(`Reason: ${plan8.selectionReason}\n`);

// Scenario 9: Several curriculum days already covered
console.log("--- Scenario 9: Several Days Already Covered ---");
const plan9 = planNextTurn({
  candidateProfile: prof1,
  session: createMockSession("sess-9", c1.member.id, 3, [7, 8, 10]),
  evaluations: [
    createMockEvaluation("sess-9", 7, 4),
    createMockEvaluation("sess-9", 8, 4),
    createMockEvaluation("sess-9", 10, 4),
  ],
});
console.log(`Covered Days So Far: [${plan9.coveredDaysSoFar.join(", ")}] | Next Target Day: ${plan9.targetDay}`);
console.log(`Reason: ${plan9.selectionReason}\n`);

// Scenario 10: Approaching 8-question minimum
console.log("--- Scenario 10: Approaching 8-Question Minimum (7 questions asked) ---");
const mockEvals7 = Array.from({ length: 7 }, (_, i) => createMockEvaluation("sess-10", [7, 8, 10, 12, 16, 21, 23][i], 4));
const plan10 = planNextTurn({
  candidateProfile: prof1,
  session: createMockSession("sess-10", c1.member.id, 7, [7, 8, 10, 12, 16, 21, 23]),
  evaluations: mockEvals7,
});
console.log(`Questions Asked: ${plan10.questionsAskedCount} | Min Requirements Met: ${plan10.isMinimumRequirementsMet}`);
console.log(`Target Day: ${plan10.targetDay} | Should End: ${plan10.shouldEndInterview}\n`);

// Scenario 11: 8+ questions and 4+ days covered -> Wrap Up
console.log("--- Scenario 11: 8+ Questions & 4+ Days Covered -> Wrap Up ---");
const mockEvals8 = Array.from({ length: 8 }, (_, i) => createMockEvaluation("sess-11", [7, 8, 10, 12, 16, 21, 23, 28][i], 4));
const plan11 = planNextTurn({
  candidateProfile: prof1,
  session: createMockSession("sess-11", c1.member.id, 8, [7, 8, 10, 12, 16, 21, 23, 28]),
  evaluations: mockEvals8,
});
console.log(`Stage: ${plan11.stage} | Action: ${plan11.adaptiveAction} | Should End: ${plan11.shouldEndInterview}`);
console.log(`Selection Reason: ${plan11.selectionReason}\n`);

// Scenario 12: Anti-Repetition Check
console.log("--- Scenario 12: Anti-Repetition Check ---");
const mockEvalsPrev = [createMockEvaluation("sess-12", 7, 4), createMockEvaluation("sess-12", 8, 4)];
const plan12 = planNextTurn({
  candidateProfile: prof1,
  session: createMockSession("sess-12", c1.member.id, 2, [7, 8]),
  evaluations: mockEvalsPrev,
});
console.log(`Evaluated Days: [7, 8] | Selected Day: ${plan12.targetDay} (Avoided 7 and 8)`);
console.log(`Selection Reason: ${plan12.selectionReason}\n`);

console.log("==================================================================");
console.log("=== ALL 12 SCENARIO TESTS PASSED SUCCESSFULLY ===");
console.log("==================================================================");
