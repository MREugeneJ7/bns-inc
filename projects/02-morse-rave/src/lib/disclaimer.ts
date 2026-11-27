export const SIGNED_KEY = "flashback:terms-of-trip";

/** ?terms=speedrun shrinks every wait so the flow can be tested in seconds. */
const SPEED =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("terms") === "speedrun"
    ? 0.04
    : 1;

export const READ_SECONDS = 30 * SPEED;
export const HONOR_SECONDS = 15 * SPEED;
export const VERIFY_MS = 3600 * Math.max(SPEED, 0.1);

export const VETERAN_PHRASE = "I take drugs, seriously";

export function readSigned(): boolean {
  try {
    return window.sessionStorage.getItem(SIGNED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSigned() {
  try {
    window.sessionStorage.setItem(SIGNED_KEY, "1");
  } catch {
    /* Private mode: the gate simply returns next time. */
  }
}

export type Clause = { title: string; body: string };

/**
 * Deliberately uniform: nothing marks the sincere clauses (flashing lights,
 * dizziness, substances, medical) apart from the jokes. All of them are
 * accurate where they give advice.
 */
export const CLAUSES: Clause[] = [
  {
    title: "Welcome, valued human",
    body: "Please read every word. We will know if you didn't. (We will not know. But we will feel it.)",
  },
  {
    title: "Flashing lights. Not a metaphor.",
    body: "This site strobes, pulses, sweeps and occasionally lies to your retinas. If you have photosensitive epilepsy, suspect you might, or have a cousin who 'gets weird around disco balls', please leave now. This is the clause we mean most literally. Soft glow exists. Use it.",
  },
  {
    title: "Dizzy? Nauseous? Seeing things?",
    body: "Press Stop, hit Esc, look at something boring and breathe. Do not 'push through the drop'. Nobody has ever won an award for pushing through a drop.",
  },
  {
    title: "Regarding substances",
    body: "We make no recommendation regarding any substance. None. Zero. If you showed up already 'enhanced', congratulations on the timing, but understand that loud bass, strobing light and visuals that deliberately get stranger every loop can wind an altered mind tighter than a drum skin. Hydrate. Sit down. Keep a sober friend within shouting distance. Do not combine this with anything you cannot spell.",
  },
  {
    title: "This is not a drug",
    body: "Flashback is not a drug, a substitute for a drug, or a gateway to a drug. It is a Morse code toy that got completely out of hand. Any spiritual experience, sudden clarity about your ex, or conversation with the lamp is your own responsibility and, frankly, your own material.",
  },
  {
    title: "Deliberate escalation",
    body: "The longer your message loops, the weirder everything becomes. Colors drift, clocks melt, a mustache appears. This is intentional. In other industries it is called 'engagement'.",
  },
  {
    title: "The Bad Trip clause",
    body: "Type something rude, or lose a 1-in-100 dice roll, and the app summons a Bad Trip: loop locked on, haunted sound, dark colors, and distorted light shaped like spiders, clowns and blood. Yes, we built that. No, we will not apologize. Stop or Esc gets you out. Editing the text gets you out. Remorse is optional.",
  },
  {
    title: "Phobias",
    body: "If you are afraid of spiders, clowns, blood, or merely of being surprised, avoid profanity and avoid luck. The dice cannot be bribed.",
  },
  {
    title: "Legal-ish",
    body: "Whatever you took, are taking or are thinking about taking may be illegal where you are. We are not your lawyer, doctor, pharmacist or mother. Your local health service has real harm-reduction information. It is better than ours. It is also less sarcastic.",
  },
  {
    title: "Medical-ish",
    body: "If you are genuinely worried about how you feel, stop using this site and call your local emergency number or poison control. We would normally say 'do not panic', but if panicking is what gets you to call, panic responsibly.",
  },
  {
    title: "Eye tracking (sort of)",
    body: "To verify that you read all of this, we will ask for your camera and microphone. We do not look through them. We do nothing with them. We are as uncomfortable about this as you are. You can say no. We will simply believe you less.",
  },
  {
    title: "Volume",
    body: "Start low. Your ears do not respawn.",
  },
  {
    title: "Waiver of excuses",
    body: "By continuing you give up the right to say 'nobody told me', 'it didn't say anything about that' and 'I was fine a minute ago'. We told you. It said all of that. You were fine a minute ago; that is exactly how it works.",
  },
  {
    title: "On sincerity",
    body: "Some of the above is a joke. Some of it is not. We will not tell you which. Please treat all of it as if it matters, especially the parts about seizures and substances. Especially those.",
  },
];

export type Box = {
  id: number;
  text: string;
  /** The state the box has to be in for the page to be accepted. */
  required: boolean;
  initial: boolean;
  kind: "agree" | "untick" | "double";
};

const AGREE = [
  "I have read the text above in full, or at least made eye contact with it.",
  "I understand the lights flash and I will not blame the lights.",
  "I understand the sound gets loud and my ears are my own problem.",
  "I am not operating a vehicle, a forklift or a small crane.",
  "I know where the Stop button and the Esc key live.",
  "I understand this is a Morse code toy, not a medical device.",
  "I have water within reach, or I will go and get some. Now. Go.",
  "I accept that spiders, clowns and blood may appear.",
  "I understand the Bad Trip is a feature, not a bug.",
  "I am not using this website to make any life decision.",
  "I accept that nobody here is a doctor.",
  "I confirm I am old enough to click this.",
  "I have a sober person within shouting distance, or I am that person.",
  "I accept that the escalation is deliberate.",
  "I am somewhere it is fine to lose track of time.",
  "I will stop if I feel unwell, even if the bass is amazing.",
  "I understand profanity may summon the Bad Trip.",
  "I understand the 1% dice have opinions about me.",
  "I understand photosensitive epilepsy is real and not a bit.",
  "I will use Soft glow if I have any doubt about my brain.",
  "I know that mixing substances with strobes is a bad idea.",
  "I know music will not fix a panic attack.",
  "I will not start a long loop when I am already overwhelmed.",
  "I have told someone nearby what I am about to do.",
  "I accept that I may see a clown who is not there.",
  "I accept responsibility for my own volume knob.",
  "I accept that these checkboxes were designed with contempt.",
  "I accept that you will not refund the time I spend here.",
  "I understand being fine now does not mean being fine later.",
  "I acknowledge a camera light may blink at me for a moment.",
  "I understand the lamp is a lamp and not a prophet.",
  "I acknowledge that I have scrolled further than I wanted to.",
];

const UNTICK = [
  "Yes, I would like to remain completely uninformed.",
  "Please do not send me any helpful safety reminders.",
  "I prefer to ignore all of the above.",
  "I decline to find out where the exit is.",
  "I would like this page to be shorter. (It will not be.)",
  "I wish to receive no water. At all. Ever.",
  "I would rather not take any breaks, ever.",
  "I refuse to stop if I feel unwell.",
];

const DOUBLE = [
  "I do not disagree that I am not unaware of the risks.",
  "I would not say that I have failed to not read this.",
  "I cannot deny that I have not declined to understand.",
  "It is untrue that I am unwilling to not stop when told.",
  "I do not refuse to acknowledge that I have not not been warned.",
  "I am not unable to avoid not being responsible.",
  "Nothing here is not meant seriously, and I do not not know that.",
  "I do not fail to avoid ignoring the seizure part.",
];

function buildBoxes(): Box[] {
  const boxes: Box[] = [];
  let a = 0;
  let u = 0;
  let d = 0;
  for (let i = 0; i < AGREE.length + UNTICK.length + DOUBLE.length; i++) {
    if (i % 6 === 2) {
      boxes.push({ id: i, text: UNTICK[u++], required: false, initial: true, kind: "untick" });
    } else if (i % 6 === 4) {
      boxes.push({ id: i, text: DOUBLE[d++], required: true, initial: false, kind: "double" });
    } else {
      boxes.push({ id: i, text: AGREE[a++], required: true, initial: false, kind: "agree" });
    }
  }
  return boxes;
}

export const BOXES: Box[] = buildBoxes();
export const BOXES_PER_PAGE = 8;

export type Round = {
  question: string;
  agree: string;
  disagree: string;
  agreeFirst: boolean;
  agreeTone: "muted" | "danger";
};

/** The "agree" answer always advances. Its colour and position never behave. */
export const ROUNDS: Round[] = [
  {
    question: "Do you agree to everything above?",
    agree: "I agree",
    disagree: "I disagree",
    agreeFirst: false,
    agreeTone: "muted",
  },
  {
    question: "Are you sure you are not unsure?",
    agree: "Yes, I am not unsure",
    disagree: "No, I am unsure",
    agreeFirst: true,
    agreeTone: "danger",
  },
  {
    question: "Please confirm that you have confirmed your confirmation.",
    agree: "Confirm",
    disagree: "Cancel",
    agreeFirst: false,
    agreeTone: "muted",
  },
  {
    question: "Last chance to leave. Nobody has ever taken it.",
    agree: "Stay",
    disagree: "Leave",
    agreeFirst: true,
    agreeTone: "danger",
  },
  {
    question: "Final answer. Do you accept being accepted?",
    agree: "Accept",
    disagree: "Deny",
    agreeFirst: false,
    agreeTone: "muted",
  },
];

export const WRONG_NOTES = [
  "Denied? Bold. Back you go.",
  "That was the wrong button. Statistically it usually is.",
  "We saw that. Returning you to the previous confirmation.",
  "Interesting choice. Wrong, but interesting.",
];

export const EYE_LINES = [
  "Measuring your saccades...",
  "Cross-referencing your pupils with a lawyer...",
  "Detecting the moment you skimmed clause 9...",
  "Judging your posture...",
  "Calibrating contempt...",
];

/** Accepts "I take drugs, seriously" in English or Spanish; rejects negations. */
export function matchesVeteranPhrase(input: string): boolean {
  const t = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return false;
  if (/\b(not|dont|don t|never|nunca|no|nada)\b/.test(t)) return false;
  const english = /\bdrugs?\b/.test(t) && /\bserious(ly)?\b/.test(t);
  const spanish = /\bdrogas?\b/.test(t) && /\b(en ?serio|seriamente)\b/.test(t);
  return english || spanish;
}
