import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEPRECATION_EPILOGUES,
  IMPLANT_CHARACTER_ID,
  ZERO_CLICK_MESSAGE,
  rememberImplantChoice,
  shouldShowDeprecated,
} from "../src/game/epilogue";
import { ANOMALIES, ERAS, WORLD_EVENTS, dateForDay } from "../src/game/world";

const survivor = {
  screen: "playing",
  year: 2027,
  reaResolved: true,
  hasFatalCondition: false,
};

test("the chip branches use the actual implant encounter and its two choices", () => {
  const encounter = ANOMALIES.find(character => character.id === IMPLANT_CHARACTER_ID);
  assert.ok(encounter);
  assert.match(encounter.left.label, /instalar el implante/);
  assert.match(encounter.right.label, /legal/);
  assert.equal(rememberImplantChoice("unseen", encounter.id, "left"), "accepted");
  assert.equal(rememberImplantChoice("unseen", encounter.id, "right"), "rejected");
});

test("unrelated encounters do not mark the chip as offered", () => {
  assert.equal(rememberImplantChoice("unseen", "vc-tiburon", "left"), "unseen");
  assert.equal(rememberImplantChoice("unseen", "anomaly-implant-hack", "right"), "unseen");
  assert.equal(rememberImplantChoice("rejected", "cto-quemado", "left"), "rejected");
});

test("a later rejection does not uninstall an accepted chip", () => {
  assert.equal(rememberImplantChoice("accepted", IMPLANT_CHARACTER_ID, "right"), "accepted");
  assert.equal(rememberImplantChoice("rejected", IMPLANT_CHARACTER_ID, "left"), "accepted");
});

test("the epilogue is only eligible after REA and from 2027 onwards", () => {
  assert.equal(shouldShowDeprecated(survivor), true);
  assert.equal(shouldShowDeprecated({ ...survivor, year: 2026 }), false);
  assert.equal(shouldShowDeprecated({ ...survivor, reaResolved: false }), false);
  assert.equal(shouldShowDeprecated({ ...survivor, year: 2028 }), true);
});

test("real fatal conditions block the epilogue even behind green motivational bars", () => {
  assert.equal(shouldShowDeprecated({ ...survivor, hasFatalCondition: true }), false);
});

test("victory, death, menu and an existing epilogue cannot be overwritten", () => {
  for (const screen of ["won", "dead", "soulless", "intro", "deprecated"]) {
    assert.equal(shouldShowDeprecated({ ...survivor, screen }), false, screen);
  }
});

test("REA's final verdict actually occurs in 2027, after its warnings", () => {
  const verdict = WORLD_EVENTS.find(event => event.special === "rea-verdict");
  assert.ok(verdict);
  const year = dateForDay(ERAS[verdict.eraIndex].startDay).getFullYear();
  assert.equal(year, 2027);
  const warnings = WORLD_EVENTS.filter(event => event.id.startsWith("rea-") && event.eraIndex < verdict.eraIndex);
  assert.equal(warnings.length, 3);
  assert.equal(shouldShowDeprecated({ ...survivor, year }), true);
});

test("no death in January: two full months of agony before the secret terminal month", () => {
  const reaVerdict = WORLD_EVENTS.find(event => event.special === "rea-verdict");
  assert.ok(reaVerdict);
  const agony = ERAS.slice(reaVerdict.eraIndex + 1, reaVerdict.eraIndex + 3);
  assert.deepEqual(agony.map(e => e.label), ["FEB 2027", "MAR 2027"]);
  assert.ok(WORLD_EVENTS.some(e => e.id === "agony-clone-pricing" && e.eraIndex === reaVerdict.eraIndex + 1));
  assert.ok(WORLD_EVENTS.some(e => e.id === "agony-zero-click" && e.eraIndex === reaVerdict.eraIndex + 2));
  // era 20 = ENE 2027 (veredicto), 21 = FEB, 22 = MAR: prohibido morir antes de la 23
  assert.equal(shouldShowDeprecated({ ...survivor, eraIndex: 20, terminalEra: 23 }), false);
  assert.equal(shouldShowDeprecated({ ...survivor, eraIndex: 22, terminalEra: 23 }), false);
  assert.equal(shouldShowDeprecated({ ...survivor, eraIndex: 23, terminalEra: 23 }), true);
  assert.equal(shouldShowDeprecated({ ...survivor, eraIndex: 24, terminalEra: 25 }), false);
  assert.equal(shouldShowDeprecated({ ...survivor, eraIndex: 25, terminalEra: 25 }), true);
});

test("the three narratives share zero-click deprecation but have different fates", () => {
  assert.match(ZERO_CLICK_MESSAGE, /zero-click ha ganado/);
  assert.match(ZERO_CLICK_MESSAGE, /interfaz de la IA/);
  assert.match(ZERO_CLICK_MESSAGE, /@Deprecated/);
  assert.match(DEPRECATION_EPILOGUES.accepted.narrative, /tambi\u00e9n eres un agente/);
  assert.match(DEPRECATION_EPILOGUES.rejected.narrative, /Deber\u00edas haberlo aceptado/);
  assert.match(DEPRECATION_EPILOGUES.unseen.narrative, /cangrejo rey en el mar de Bering/);
  assert.doesNotMatch(DEPRECATION_EPILOGUES.accepted.narrative, /cangrejo rey/);
  assert.doesNotMatch(DEPRECATION_EPILOGUES.rejected.narrative, /cangrejo rey/);
});