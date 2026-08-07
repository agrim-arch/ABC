import type { QuestionType } from "@/types/database";
import type {
  AdaptiveAction,
  AnswerQuality,
  InterviewStage,
  NextQuestionPlan,
  OrchestratorInput,
  QuestionDifficulty,
} from "@/types/orchestrator";
import { getCurriculumDay, getModuleForDay } from "@/lib/intelligence/curriculumMapper";

/**
 * Deterministic planning engine that decides WHAT the AI interviewer should test next.
 */
export function planNextTurn(input: OrchestratorInput): NextQuestionPlan {
  const { candidateProfile, session, evaluations, lastCandidateAnswer } = input;
  const currentTurn = session.current_turn + 1;

  // Track covered curriculum days from evaluations and session state
  const evaluatedDays = new Set(evaluations.map((e) => e.day));
  const coveredDaysSet = new Set([...session.covered_days, ...Array.from(evaluatedDays)]);
  const coveredDaysSoFar = Array.from(coveredDaysSet).sort((a, b) => a - b);

  const questionsAskedCount = evaluations.length;
  const isMinimumRequirementsMet =
    questionsAskedCount >= 8 && coveredDaysSoFar.length >= 4;

  // Check if interview should end
  if (questionsAskedCount >= 10 || (isMinimumRequirementsMet && currentTurn >= 10)) {
    const lastEval = evaluations[evaluations.length - 1];
    const targetDay = lastEval ? lastEval.day : 31;
    const cDay = getCurriculumDay(targetDay) || getCurriculumDay(31)!;
    const mod = getModuleForDay(targetDay);

    return {
      sessionId: session.session_id,
      currentTurn,
      stage: "WRAP_UP",
      targetDay: cDay.day,
      targetModuleN: mod ? mod.n : 8,
      targetModuleTitle: mod ? mod.title : "Production & Capstone",
      targetTopicTitle: cDay.title,
      targetTools: cDay.tools,
      targetObjectives: cDay.objectives,
      questionType: "conceptual",
      difficulty: "MEDIUM",
      isFollowUp: false,
      adaptiveAction: "WRAP_UP_INTERVIEW",
      selectionReason: `Minimum requirements met (${questionsAskedCount} questions asked across ${coveredDaysSoFar.length} curriculum days). Preparing final feedback.`,
      triggeringEvidence: `Candidate completed ${questionsAskedCount} evaluated questions.`,
      coveredDaysSoFar,
      questionsAskedCount,
      isMinimumRequirementsMet: true,
      shouldEndInterview: true,
    };
  }

  // Determine Answer Quality of previous turn if available
  let lastQuality: AnswerQuality | undefined = lastCandidateAnswer?.quality;
  if (lastCandidateAnswer && !lastQuality) {
    const score = lastCandidateAnswer.score || 3;
    if (score >= 4) lastQuality = "STRONG";
    else if (score === 3) lastQuality = "PARTIALLY_CORRECT";
    else if (score === 2) lastQuality = "WEAK";
    else lastQuality = "UNCERTAIN";
  }

  const lastEval = evaluations[evaluations.length - 1];

  // -------------------------------------------------------------
  // ADAPTIVE FOLLOW-UP RULES (Rule A, B, C)
  // -------------------------------------------------------------

  // Rule 1: Weak or Uncertain previous answer -> Diagnostic Follow-Up
  if (lastEval && (lastQuality === "WEAK" || lastQuality === "UNCERTAIN")) {
    const targetDay = lastEval.day;
    const cDay = getCurriculumDay(targetDay)!;
    const mod = getModuleForDay(targetDay);

    return {
      sessionId: session.session_id,
      currentTurn,
      stage: "ADAPTIVE_DEPTH",
      targetDay,
      targetModuleN: mod ? mod.n : 1,
      targetModuleTitle: mod ? mod.title : "General",
      targetTopicTitle: cDay.title,
      targetTools: cDay.tools,
      targetObjectives: cDay.objectives,
      questionType: "follow_up",
      difficulty: "EASY",
      isFollowUp: true,
      adaptiveAction: "DIAGNOSE_WEAKNESS",
      selectionReason: `Previous response on Day ${targetDay} showed conceptual ambiguity (Quality: ${lastQuality}). Issuing targeted diagnostic follow-up.`,
      triggeringEvidence: `Candidate answer score: ${lastCandidateAnswer?.score || "N/A"} on Day ${targetDay} (${cDay.title}).`,
      coveredDaysSoFar,
      questionsAskedCount,
      isMinimumRequirementsMet,
      shouldEndInterview: false,
    };
  }

  // Rule 2: Partially Correct previous answer -> Targeted Follow-Up
  if (lastEval && lastQuality === "PARTIALLY_CORRECT") {
    const targetDay = lastEval.day;
    const cDay = getCurriculumDay(targetDay)!;
    const mod = getModuleForDay(targetDay);

    return {
      sessionId: session.session_id,
      currentTurn,
      stage: "ADAPTIVE_DEPTH",
      targetDay,
      targetModuleN: mod ? mod.n : 1,
      targetModuleTitle: mod ? mod.title : "General",
      targetTopicTitle: cDay.title,
      targetTools: cDay.tools,
      targetObjectives: cDay.objectives,
      questionType: "follow_up",
      difficulty: "MEDIUM",
      isFollowUp: true,
      adaptiveAction: "FOLLOW_UP_MISSING_CONCEPT",
      selectionReason: `Previous answer on Day ${targetDay} was partially correct. Asking follow-up to probe missing implementation detail.`,
      triggeringEvidence: `Candidate answer on Day ${targetDay} missed specific core objective.`,
      coveredDaysSoFar,
      questionsAskedCount,
      isMinimumRequirementsMet,
      shouldEndInterview: false,
    };
  }

  // Rule 3: Strong answer on current topic -> Deepen or Advance
  if (lastEval && lastQuality === "STRONG" && lastEval.question_type === "conceptual") {
    const targetDay = lastEval.day;
    const cDay = getCurriculumDay(targetDay)!;
    const mod = getModuleForDay(targetDay);

    return {
      sessionId: session.session_id,
      currentTurn,
      stage: "SYSTEM_APPLICATION",
      targetDay,
      targetModuleN: mod ? mod.n : 1,
      targetModuleTitle: mod ? mod.title : "General",
      targetTopicTitle: cDay.title,
      targetTools: cDay.tools,
      targetObjectives: cDay.objectives,
      questionType: "application",
      difficulty: "HARD",
      isFollowUp: true,
      adaptiveAction: "DEEPEN_DIFFICULTY",
      selectionReason: `Candidate demonstrated strong conceptual understanding on Day ${targetDay}. Elevating difficulty to practical application/system design.`,
      triggeringEvidence: `Candidate scored high on conceptual question for Day ${targetDay}.`,
      coveredDaysSoFar,
      questionsAskedCount,
      isMinimumRequirementsMet,
      shouldEndInterview: false,
    };
  }

  // -------------------------------------------------------------
  // NEW TOPIC SELECTION (Anti-Repetition & Candidate-Aware Priorities)
  // -------------------------------------------------------------

  // Filter candidate priorities that haven't been tested yet
  const untestedFailed = candidateProfile.failedDays.filter((d) => !evaluatedDays.has(d));
  const untestedSkipped = candidateProfile.skippedDays.filter((d) => !evaluatedDays.has(d));
  const untestedStruggled = candidateProfile.struggledDays.filter((d) => !evaluatedDays.has(d));
  
  // Core curriculum days to ensure broad coverage across modules
  const coreCurriculumDays = [7, 8, 10, 11, 13, 16, 21, 22, 23, 28];
  const untestedCore = coreCurriculumDays.filter((d) => !evaluatedDays.has(d));

  let selectedDay: number;
  let selectionReason: string;
  let triggeringEvidence: string;
  let stage: InterviewStage = "TARGETED_DIAGNOSTIC";
  let qType: QuestionType = "conceptual";
  let difficulty: QuestionDifficulty = "MEDIUM";

  if (untestedFailed.length > 0) {
    selectedDay = untestedFailed[0];
    selectionReason = `Candidate failed Day ${selectedDay} mission during cohort. Investigating whether weakness persists.`;
    triggeringEvidence = `Candidate failed mission on Day ${selectedDay} in learning history.`;
    difficulty = "EASY";
  } else if (untestedSkipped.length > 0) {
    selectedDay = untestedSkipped[0];
    selectionReason = `Candidate skipped Day ${selectedDay} mission during cohort. Assessing foundational knowledge on skipped topic.`;
    triggeringEvidence = `Candidate skipped Day ${selectedDay} mission.`;
    difficulty = "MEDIUM";
  } else if (untestedStruggled.length > 0) {
    selectedDay = untestedStruggled[0];
    const dayPerf = candidateProfile.dayPerformanceMap[selectedDay];
    selectionReason = `Candidate required ${dayPerf?.attempts || 2} attempts on Day ${selectedDay}. Investigating whether this represents persistent weakness or successful iteration.`;
    triggeringEvidence = `Candidate required ${dayPerf?.attempts || 2} attempts on Day ${selectedDay}.`;
    difficulty = "MEDIUM";
  } else if (untestedCore.length > 0) {
    selectedDay = untestedCore[0];
    selectionReason = `Broadening curriculum coverage to key AI engineering topic (Day ${selectedDay}).`;
    triggeringEvidence = `Core topic Day ${selectedDay} unexamined in interview.`;
    stage = coveredDaysSoFar.length >= 3 ? "SYSTEM_APPLICATION" : "BASELINE";
    qType = coveredDaysSoFar.length >= 3 ? "application" : "conceptual";
  } else {
    // Fallback: pick next unexamined curriculum day
    const allDays = Array.from({ length: 31 }, (_, i) => i + 1);
    const unexamined = allDays.filter((d) => !evaluatedDays.has(d));
    selectedDay = unexamined.length > 0 ? unexamined[0] : 31;
    selectionReason = `Selected Day ${selectedDay} to fulfill curriculum depth.`;
    triggeringEvidence = `Day ${selectedDay} next in sequence.`;
    stage = "SYSTEM_APPLICATION";
  }

  const cDay = getCurriculumDay(selectedDay)!;
  const mod = getModuleForDay(selectedDay);

  if (currentTurn <= 2 && evaluations.length === 0) {
    stage = "BASELINE";
  }

  return {
    sessionId: session.session_id,
    currentTurn,
    stage,
    targetDay: cDay.day,
    targetModuleN: mod ? mod.n : 1,
    targetModuleTitle: mod ? mod.title : "General",
    targetTopicTitle: cDay.title,
    targetTools: cDay.tools,
    targetObjectives: cDay.objectives,
    questionType: qType,
    difficulty,
    isFollowUp: false,
    adaptiveAction: "ADVANCE_TOPIC",
    selectionReason,
    triggeringEvidence,
    coveredDaysSoFar,
    questionsAskedCount,
    isMinimumRequirementsMet,
    shouldEndInterview: false,
  };
}
