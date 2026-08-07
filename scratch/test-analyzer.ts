import candidateData from "../hackathon-context/candidates.json";
import { analyzeCandidate } from "../src/lib/intelligence/analyzer";
import type { CandidateProfile } from "../src/types";

const candidates = candidateData.candidates as CandidateProfile[];

const candidatesToTest = ["CAND-001", "CAND-003", "CAND-004", "CAND-010"];

console.log("=== PHASE 4: CANDIDATE INTELLIGENCE ANALYZER TEST ===\n");

candidatesToTest.forEach((id) => {
  const candidate = candidates.find((c) => c.member.id === id);
  if (!candidate) {
    console.error(`Candidate ${id} not found.`);
    return;
  }

  const profile = analyzeCandidate(candidate);

  console.log(`--------------------------------------------------`);
  console.log(`CANDIDATE: ${profile.candidateName} (${profile.candidateId})`);
  console.log(`Role: ${profile.jobRole} | Exp: ${profile.yearsExperience} yrs`);
  console.log(`Completion Rate: ${Math.round(profile.metrics.completionRate * 100)}%`);
  console.log(`First-Try Success: ${Math.round(profile.metrics.firstTrySuccessRate * 100)}%`);
  console.log(`Strong Days: ${profile.strongDays.length} | Struggled: ${profile.struggledDays.length} | Skipped: ${profile.skippedDays.length} | Failed: ${profile.failedDays.length}`);
  console.log(`\nExecutive Summary:\n${profile.executiveSummary}\n`);
  console.log(`Top 3 Probing Recommendations:`);
  profile.recommendedProbingAreas.slice(0, 3).forEach((rec, idx) => {
    console.log(`  ${idx + 1}. [${rec.priority}] Day ${rec.day} (${rec.topicTitle}): ${rec.suggestedFocus}`);
  });
  console.log(`--------------------------------------------------\n`);
});
