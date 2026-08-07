import curriculumRaw from "../../../hackathon-context/curriculum.json";
import type { Curriculum, CurriculumDay, CurriculumModule } from "@/types";

export const curriculum: Curriculum = curriculumRaw as Curriculum;

/**
 * Returns the CurriculumDay object for a given day number.
 */
export function getCurriculumDay(dayNumber: number): CurriculumDay | undefined {
  return curriculum.days.find((d) => d.day === dayNumber);
}

/**
 * Returns the CurriculumModule that contains the given day number.
 */
export function getModuleForDay(dayNumber: number): CurriculumModule | undefined {
  return curriculum.modules.find((m) => m.days.includes(dayNumber));
}

/**
 * Returns all CurriculumDay objects belonging to a specific module number.
 */
export function getDaysForModule(moduleN: number): CurriculumDay[] {
  const mod = curriculum.modules.find((m) => m.n === moduleN);
  if (!mod) return [];
  return curriculum.days.filter((d) => mod.days.includes(d.day));
}
