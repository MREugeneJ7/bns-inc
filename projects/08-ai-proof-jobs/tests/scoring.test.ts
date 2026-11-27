import assert from "node:assert/strict";
import { JOBS, JOB_ORDER } from "../src/data/jobs";
import { QUESTIONS } from "../src/data/questions";
import { scoreAnswers, type Answers } from "../src/data/scoring";

const answers: Answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, 0]));
answers[3] = 0;
answers[12] = 1;
answers[18] = 2;

assert.equal(QUESTIONS.length, 52);
assert.equal(new Set(QUESTIONS.map((question) => question.id)).size, QUESTIONS.length);
assert.equal(JOB_ORDER.length, 20);
assert(QUESTIONS.every((question) => question.options.length >= 3));
assert(QUESTIONS.filter((question) => question.filler).every((question) =>
  question.options.every((option) => !option.traits && !option.flags),
));

for (const id of JOB_ORDER) {
  const job = JOBS[id];
  assert([1, 2, 3, 4].includes(job.collateral.level), `Invalid collateral level: ${id}`);
  assert(job.collateral.text.length > 120, `Collateral analysis too short: ${id}`);
  assert(job.warning.length > 40 && job.justification.length > 120, `Incomplete dossier: ${id}`);
}
console.log("Every dossier carries a second-order risk analysis.");

const spoiler = /\b(mimo|cangrejo|fontanero|bombero|tarotista|m[eé]dium|hipnotista|arbitro|árbitro|pastor|comedor|pol[ií]tico|prostitu|stuntman)\b/i;
assert(QUESTIONS.every((question) => !spoiler.test([question.text, ...question.options.map((option) => option.text)].join(" "))));

const first = scoreAnswers(answers);
assert.deepEqual(first, scoreAnswers(answers), "The same answers must always produce the same result");
assert.equal(first.ranking.length, JOB_ORDER.length);

const changedFillers = { ...answers };
QUESTIONS.filter((question) => question.filler).forEach((question) => {
  changedFillers[question.id] = question.options.length - 1;
});
assert.deepEqual(first, scoreAnswers(changedFillers), "Filler answers must not influence the result");

const noRisk = scoreAnswers({ ...answers, 12: 0 });
assert(noRisk.ranking.every(({ id }) => !JOBS[id].highRisk), "High-risk occupations require opt-in");
const minor = scoreAnswers({ ...answers, 3: 1 });
assert(minor.ranking.every(({ id }) => !JOBS[id].intimate && !JOBS[id].highRisk), "Adult-only occupations must be hidden for minors");
const unspecifiedAge = scoreAnswers({ ...answers, 3: 2 });
assert(unspecifiedAge.ranking.every(({ id }) => !JOBS[id].intimate && !JOBS[id].highRisk));
const noIntimacy = scoreAnswers({ ...answers, 18: 1 });
assert(noIntimacy.ranking.every(({ id }) => !JOBS[id].intimate), "Intimate occupations require explicit opt-in");

let seed = 481516;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

const winners = new Set<string>();
for (let iteration = 0; iteration < 20000; iteration += 1) {
  const sample: Answers = {};
  QUESTIONS.forEach((question) => {
    sample[question.id] = Math.floor(random() * question.options.length);
  });
  sample[3] = 0;
  sample[12] = 1;
  sample[18] = 2;
  winners.add(scoreAnswers(sample).ranking[0].id);
}
console.log(`Random profiles reaching first place: ${winners.size}/${JOB_ORDER.length}`);
console.log("Not reached by random sampling:", JOB_ORDER.filter((id) => !winners.has(id)).join(", ") || "none");
assert.deepEqual(JOB_ORDER.filter((id) => !winners.has(id)), [], "Every occupation must be able to rank first");
console.log("Scoring, privacy, consent and filler checks passed.");