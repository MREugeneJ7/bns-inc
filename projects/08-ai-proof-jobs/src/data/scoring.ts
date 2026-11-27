import { JOBS, JOB_ORDER, type JobId } from "./jobs";
import { QUESTIONS, type AnswerFlags } from "./questions";
import { TRAITS, type TraitId } from "./traits";

export type Answers = Record<number, number>;

export interface RankedJob {
  id: JobId;
  score: number;
  reasons: string[];
}

const traitIds = Object.keys(TRAITS) as TraitId[];
const questionTraits = QUESTIONS.map((question) =>
  Array.from(new Set(question.options.flatMap((option) => Object.keys(option.traits ?? {}) as TraitId[]))),
);

export function scoreAnswers(answers: Answers): { ranking: RankedJob[]; flags: AnswerFlags } {
  const sums = Object.fromEntries(traitIds.map((id) => [id, 0])) as Record<TraitId, number>;
  const observations = Object.fromEntries(traitIds.map((id) => [id, 0])) as Record<TraitId, number>;
  const flags: AnswerFlags = {};

  QUESTIONS.forEach((question, index) => {
    const option = question.options[answers[question.id]];
    if (!option) return;

    Object.assign(flags, option.flags);
    if (question.filler) return;

    for (const trait of questionTraits[index]) {
      const baseline = question.options.reduce((sum, choice) => sum + (choice.traits?.[trait] ?? 0), 0) / question.options.length;
      sums[trait] += (option.traits?.[trait] ?? 0) - baseline;
      observations[trait] += 1;
    }
  });

  const signals = Object.fromEntries(
    traitIds.map((id) => [id, observations[id] ? sums[id] / (2 * (observations[id] + 2)) : 0]),
  ) as Record<TraitId, number>;

  const ranking = JOB_ORDER.filter((id) => {
    const job = JOBS[id];
    if (job.intimate && (!flags.adult || !flags.intimate)) return false;
    if (job.highRisk && (!flags.adult || !flags.risk)) return false;
    return true;
  })
    .map((id) => {
      const profile = Object.entries(JOBS[id].profile) as [TraitId, number][];
      const totalWeight = profile.reduce((sum, [, weight]) => sum + Math.abs(weight), 0);
      const alignment = profile.reduce((sum, [trait, weight]) => sum + signals[trait] * weight, 0) / totalWeight;
      const reasons = profile
        .map(([trait, weight]) => ({ trait, weight, contribution: signals[trait] * weight }))
        .filter((item) => item.contribution > 0.04)
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 3)
        .map(({ trait, weight }) => (weight > 0 ? TRAITS[trait].positive : TRAITS[trait].negative));

      return { id, score: 50 + alignment * 50, reasons };
    })
    .sort((a, b) => b.score - a.score || JOB_ORDER.indexOf(a.id) - JOB_ORDER.indexOf(b.id));

  return { ranking, flags };
}