import type { CandidateProfile } from "@/types";
import type {
  CandidateInterviewProfile,
  CompetencyLevel,
  DayPerformance,
  ModulePerformance,
  ProbingRecommendation,
} from "@/types/intelligence";
import {
  curriculum,
  getCurriculumDay,
  getModuleForDay,
} from "./curriculumMapper";

/**
 * Analyzes a raw CandidateProfile against the 31-day curriculum
 * and produces a normalized, deterministic CandidateInterviewProfile.
 */
export function analyzeCandidate(
  candidateProfile: CandidateProfile
): CandidateInterviewProfile {
  const { member, missions, signals } = candidateProfile;

  // Build lookup map for candidate missions by day
  const missionMap = new Map<number, (typeof missions)[0]>();
  missions.forEach((m) => missionMap.set(m.day, m));

  const dayPerformanceMap: Record<number, DayPerformance> = {};
  const strongDays: number[] = [];
  const struggledDays: number[] = [];
  const skippedDays: number[] = [];
  const failedDays: number[] = [];

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalRepeatedAttempts = 0;

  // Evaluate all 31 curriculum days
  curriculum.days.forEach((cDay) => {
    const dayNum = cDay.day;
    const mission = missionMap.get(dayNum);
    const mod = getModuleForDay(dayNum);

    let status: CompetencyLevel = "UNATTEMPTED";
    let attempts = 0;

    if (mission) {
      attempts = mission.attempts || 1;
      if (mission.skipped) {
        status = "SKIPPED";
        skippedDays.push(dayNum);
        totalSkipped++;
      } else if (mission.passed === false) {
        status = "NEEDS_IMPROVEMENT";
        failedDays.push(dayNum);
        struggledDays.push(dayNum);
        totalFailed++;
      } else if (mission.passed === true) {
        totalPassed++;
        if (attempts > 1) {
          status = "SATISFACTORY";
          struggledDays.push(dayNum);
          totalRepeatedAttempts++;
        } else {
          status = "STRONG";
          strongDays.push(dayNum);
        }
      }
    }

    dayPerformanceMap[dayNum] = {
      day: dayNum,
      title: cDay.title,
      moduleN: mod ? mod.n : 0,
      moduleTitle: mod ? mod.title : "General",
      status,
      attempts,
      tools: cDay.tools,
      objectives: cDay.objectives,
    };
  });

  // Calculate Module Level Performance
  const modulePerformanceList: ModulePerformance[] = curriculum.modules.map((mod) => {
    const modDays = curriculum.days.filter((d) => mod.days.includes(d.day));
    const totalDays = modDays.length;
    let passed = 0;
    let skipped = 0;
    let failed = 0;

    modDays.forEach((d) => {
      const perf = dayPerformanceMap[d.day];
      if (perf.status === "STRONG" || perf.status === "SATISFACTORY") {
        passed++;
      } else if (perf.status === "SKIPPED") {
        skipped++;
      } else if (perf.status === "NEEDS_IMPROVEMENT") {
        failed++;
      }
    });

    const score = totalDays > 0 ? Math.round((passed / totalDays) * 100) : 0;
    let modStatus: ModulePerformance["status"] = "UNTESTED";
    if (score >= 80) modStatus = "STRONG";
    else if (score >= 50) modStatus = "MODERATE";
    else if (passed > 0 || failed > 0 || skipped > 0) modStatus = "WEAK";

    return {
      moduleN: mod.n,
      title: mod.title,
      daysTotal: totalDays,
      daysPassed: passed,
      daysSkipped: skipped,
      daysFailed: failed,
      competencyScore: score,
      status: modStatus,
    };
  });

  // Generate Probing Recommendations
  const recommendedProbingAreas: ProbingRecommendation[] = [];

  // Priority HIGH: Failed missions
  failedDays.forEach((d) => {
    const perf = dayPerformanceMap[d];
    recommendedProbingAreas.push({
      day: d,
      topicTitle: perf.title,
      moduleTitle: perf.moduleTitle,
      reason: "FAILED_MISSION",
      priority: "HIGH",
      suggestedFocus: `Candidate failed Day ${d} mission after ${perf.attempts} attempts. Probe core concepts: ${perf.objectives.slice(0, 2).join("; ")}.`,
    });
  });

  // Priority HIGH: High attempt friction (attempts >= 4)
  curriculum.days.forEach((cDay) => {
    const perf = dayPerformanceMap[cDay.day];
    if (perf.attempts >= 4 && perf.status !== "NEEDS_IMPROVEMENT") {
      recommendedProbingAreas.push({
        day: cDay.day,
        topicTitle: perf.title,
        moduleTitle: perf.moduleTitle,
        reason: "HIGH_ATTEMPTS",
        priority: "HIGH",
        suggestedFocus: `Candidate required ${perf.attempts} attempts to pass Day ${cDay.day}. Verify comprehension of ${perf.tools.join(", ")}.`,
      });
    }
  });

  // Priority HIGH: Skipped core missions
  skippedDays.forEach((d) => {
    const perf = dayPerformanceMap[d];
    recommendedProbingAreas.push({
      day: d,
      topicTitle: perf.title,
      moduleTitle: perf.moduleTitle,
      reason: "SKIPPED_MISSION",
      priority: "HIGH",
      suggestedFocus: `Candidate skipped Day ${d} (${perf.title}). Assess foundational knowledge in ${perf.tools.join(", ")}.`,
    });
  });

  // Priority MEDIUM: Role-specific probes for unattempted or moderate areas
  if (recommendedProbingAreas.length < 5) {
    struggledDays.forEach((d) => {
      const perf = dayPerformanceMap[d];
      if (perf.attempts >= 2 && perf.attempts < 4) {
        recommendedProbingAreas.push({
          day: d,
          topicTitle: perf.title,
          moduleTitle: perf.moduleTitle,
          reason: "HIGH_ATTEMPTS",
          priority: "MEDIUM",
          suggestedFocus: `Candidate passed Day ${d} with ${perf.attempts} attempts. Confirm practical implementation ability.`,
        });
      }
    });
  }

  // Derived Metrics
  const commitConsistencyRatio = Number((signals.commitDays / 31).toFixed(2));
  const completionRate = Number((signals.missionsCompleted / 31).toFixed(2));
  const firstTrySuccessRate =
    signals.missionsCompleted > 0
      ? Number((signals.missionsFirstTry / signals.missionsCompleted).toFixed(2))
      : 0;

  // Formulate Executive Summary
  const topWeakness =
    failedDays.length > 0
      ? `failed ${failedDays.length} mission(s) (Days ${failedDays.join(", ")})`
      : skippedDays.length > 0
      ? `skipped ${skippedDays.length} mission(s) (Days ${skippedDays.join(", ")})`
      : "showed high completion consistency";

  const executiveSummary = `${member.name} (${member.jobRole}, ${member.yearsExperience} yrs exp) completed ${signals.missionsCompleted}/31 missions (${Math.round(completionRate * 100)}% completion rate). First-try success rate is ${Math.round(firstTrySuccessRate * 100)}% with ${commitConsistencyRatio * 100}% commit consistency. Key focal areas for interview: candidate ${topWeakness}. Top probing targets include ${recommendedProbingAreas.slice(0, 3).map((r) => `Day ${r.day} (${r.topicTitle})`).join(", ") || "core architecture"}.`;

  return {
    candidateId: member.id,
    candidateName: member.name,
    jobRole: member.jobRole,
    yearsExperience: member.yearsExperience,
    education: member.education,
    metrics: {
      commitConsistencyRatio,
      completionRate,
      firstTrySuccessRate,
      totalPassedDays: totalPassed,
      totalFailedDays: totalFailed,
      totalSkippedDays: totalSkipped,
      totalRepeatedAttemptDays: totalRepeatedAttempts,
    },
    strongDays,
    struggledDays,
    skippedDays,
    failedDays,
    dayPerformanceMap,
    modulePerformanceList,
    recommendedProbingAreas,
    executiveSummary,
  };
}
