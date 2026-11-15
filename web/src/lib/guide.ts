// Astronaut guidance in 4 layers (decision D15): (a) status and why it
// matters, (b) what to do now, (c) when to escalate, (d) how to measure.
// Written by hand from docs/base-conocimiento/11, 12 and 13 — each line cites
// its source. Rules: no diagnosis, no medication or doses, nothing invented;
// where no countermeasure was published we say so and refer to the Crew
// Medical Officer (CMO). Educational prototype, not a medical device.
import type { IndicatorId, Status } from "./model.ts";
import type { SourceId } from "./sources.ts";

export interface Line {
  text: string;
  sources: SourceId[];
}

export interface Guide {
  why: Line[];
  now: { normal: Line[]; drift: Line[]; alert?: Line[] };
  escalate: Line[];
  measure: Line[];
}

export const NO_COUNTERMEASURE: Line = {
  text: "No published countermeasure found — contact the Crew Medical Officer.",
  sources: [],
};

const cardioNow: Line = {
  text: "Keep regular exercise and a healthy diet: the countermeasures NASA lists for cardiovascular adaptation.",
  sources: ["F-N02-cardio"],
};

export const GUIDE: Record<IndicatorId, Guide> = {
  hr: {
    why: [
      { text: "NASA lists cardiovascular adaptation among the health risks of long missions.", sources: ["F-N02-cardio"] },
      { text: "A resting heart rate that stays above your own baseline is worth checking early — even while it is still inside the 60–100 bpm range for adults on Earth.", sources: ["F-G01", "XM-RULE"] },
    ],
    now: {
      normal: [cardioNow],
      drift: [
        { text: "Re-check at rest: sit quietly for 10 minutes, then count a full minute, at the same time of day as your baseline readings.", sources: ["F-G01"] },
        cardioNow,
        { text: "Note any chest pain, shortness of breath or dizziness: they change what to do (see “When to escalate”).", sources: ["XM-RULE"] },
      ],
      alert: [{ text: "Re-check at rest now and tell the Crew Medical Officer (CMO).", sources: ["F-G01", "XM-RULE"] }],
    },
    escalate: [
      { text: "Above your baseline for several days → tell the CMO today and send a store-and-forward note to the flight surgeon. Act on board; do not wait for the reply.", sources: ["XM-RULE", "F-N15"] },
      { text: "With chest pain, shortness of breath or dizziness → alert the CMO now.", sources: ["F-M02", "XM-RULE"] },
      { text: "Chest pain or collapse → open the Emergency guide.", sources: ["F-M02", "F-M01"] },
    ],
    measure: [
      { text: "Rest at least 10 minutes. Count your pulse for a full minute at the wrist (two fingers below the base of the thumb) or at the side of the neck. Never press both sides of the neck at once.", sources: ["F-G01"] },
    ],
  },
  bp: {
    why: [
      { text: "NASA lists cardiovascular adaptation among the health risks of long missions, and the challenge names blood pressure as a key indicator.", sources: ["F-N02-cardio"] },
      { text: "The CDC categories help you read the number; your own baseline shows whether it is changing.", sources: ["F-G02", "XM-RULE"] },
    ],
    now: {
      normal: [cardioNow],
      drift: [
        { text: "Confirm with another reading later today, at the same time of day as your baseline readings.", sources: ["XM-RULE"] },
        cardioNow,
      ],
      alert: [{ text: "Tell the Crew Medical Officer (CMO) today and log any symptoms.", sources: ["XM-RULE"] }],
    },
    escalate: [
      { text: "Above 180/120 mmHg is severe. With chest pain, shortness of breath, back pain, numbness, weakness, vision changes or difficulty speaking it is an emergency → alert the CMO and open the Emergency guide.", sources: ["F-G02"] },
      { text: "Above your baseline for several days, or in stage 2 (140+/90+) → tell the CMO and send a store-and-forward note to the flight surgeon.", sources: ["F-G02", "XM-RULE", "F-N15"] },
    ],
    measure: [
      { text: "No published measurement technique in our sources yet: follow the device instructions and your crew medical training.", sources: [] },
    ],
  },
  temp: {
    why: [
      { text: "On the station, thermal control systems regulate the cabin temperature.", sources: ["F-N05"] },
      { text: "Fever is above 38 °C; below 35 °C is hypothermia. Temperature varies during the day and is lowest before dawn, so compare readings taken at the same time.", sources: ["F-G03", "F-N15"] },
    ],
    now: {
      normal: [{ text: "Measure at the same time each day so your baseline stays meaningful.", sources: ["F-G03"] }],
      drift: [NO_COUNTERMEASURE],
      alert: [NO_COUNTERMEASURE],
    },
    escalate: [{ text: "Fever (above 38 °C) → tell the Crew Medical Officer or the flight surgeon.", sources: ["F-G03", "XM-RULE"] }],
    measure: [
      { text: "No published technique in our sources yet. Measure at the same time of day.", sources: ["F-G03"] },
      { text: "On the ISS, ESA's T-Mini headband sensor has measured core body temperature without needles.", sources: ["F-N07"] },
    ],
  },
  sleep: {
    why: [
      { text: "Isolation, confinement and irregular schedules disturb sleep; NASA studies inadequate sleep as a risk of long missions.", sources: ["F-N02-sleep"] },
      { text: "NASA plans an 8.5-hour sleep period per day.", sources: ["F-N15"] },
    ],
    now: {
      normal: [{ text: "Keep consistent sleep hours.", sources: ["F-N15"] }],
      drift: [
        { text: "Use the lighting countermeasure: LED light that mimics Earth's light–dark cycle.", sources: ["F-N02-sleep", "F-N05"] },
        { text: "Protect your scheduled rest time and keep consistent sleep hours.", sources: ["F-N02-sleep", "F-N15"] },
        { text: "Avoid critical tasks during your circadian low, about 1–7 hours after your usual bedtime.", sources: ["F-N15"] },
      ],
    },
    escalate: [
      { text: "Below your baseline for several days → talk to the CMO or use your private psychological conference. NASA gives no numeric minimum, so your baseline is the reference.", sources: ["F-N15", "XM-RULE"] },
    ],
    measure: [
      { text: "Wrist actigraphy (movement and light) plus a short questionnaire on waking about sleep quality and quantity.", sources: ["F-N06", "F-N07"] },
    ],
  },
  mood: {
    why: [
      { text: "Months of isolation and confinement can affect mood and behavior; NASA treats behavioral conditions as a risk of long missions.", sources: ["F-N02-behavior"] },
    ],
    now: {
      normal: [{ text: "Stay in touch with family and protect your private time.", sources: ["F-N02-behavior"] }],
      drift: [
        { text: "Countermeasures NASA lists: keep a journal, use the windows, protect your privacy and stay in touch with family and professionals.", sources: ["F-N02-behavior"] },
        { text: "Growing fresh vegetables may help.", sources: ["F-N02-behavior"] },
        { text: "Meaningful activities and virtual-reality relaxation are being studied.", sources: ["F-N05"] },
      ],
    },
    escalate: [
      { text: "Below your baseline for several days → use your private psychological conference (store-and-forward is allowed with the delay) and tell the CMO.", sources: ["F-N15", "XM-RULE"] },
    ],
    measure: [
      { text: "Rate your mood from 1 to 5 before sleep; NASA's standard measures include a bedtime questionnaire.", sources: ["F-N06"] },
      { text: "This 1–5 scale is a team-made tool, not a validated clinical test.", sources: ["XM-RULE"] },
    ],
  },
  glucose: {
    why: [
      { text: "The challenge lists blood sugar among useful indicators. NASA's crew health standard sets no glucose limit, so we use general-health fasting ranges (ADA), declared as such.", sources: ["F-G04"] },
      { text: "NASA requires that each crew member receives 100% of their energy and nutrient needs.", sources: ["F-N15"] },
    ],
    now: {
      normal: [{ text: "Measure fasting: at least 8 hours without food.", sources: ["F-G04"] }],
      drift: [NO_COUNTERMEASURE],
      alert: [NO_COUNTERMEASURE],
    },
    escalate: [
      { text: "Fasting 100–125 mg/dL (prediabetes range) or 126+ (diabetes range) → consult the CMO or the flight surgeon. The app gives no treatment.", sources: ["F-G04", "XM-RULE"] },
    ],
    measure: [
      { text: "Measure after fasting at least 8 hours.", sources: ["F-G04"] },
      { text: "Technique: no published source in our set yet — follow the meter's instructions.", sources: [] },
    ],
  },
  radiation: {
    why: [
      { text: "Beyond Earth's protection, crews receive space radiation every day. NASA keeps a career below 600 mSv to hold the added risk of cancer death under 3%.", sources: ["F-N15", "F-N02-radiation"] },
      { text: "NASA's design brief uses about 1.5 mSv per day as a Mars-transit example.", sources: ["F-N16"] },
    ],
    now: {
      normal: [{ text: "Keep your personal dosimeter with you; NASA and the CSA monitor crew dose.", sources: ["F-N09", "F-C01"] }],
      drift: [{ text: "Follow shielding and operational procedures: NASA's countermeasures are shielding, monitoring and operations.", sources: ["F-N05", "F-N02-radiation"] }],
    },
    escalate: [
      { text: "Solar particle event alert → go to the shelter built with the vehicle's stowage and materials, such as water.", sources: ["F-N05", "F-N16"] },
      { text: "NASA designs vehicles to keep a solar particle event below 250 mSv.", sources: ["F-N15"] },
    ],
    measure: [{ text: "Read your personal dosimeter; active and passive dosimeters measure crew dose on the station.", sources: ["F-N09", "F-C01"] }],
  },
  co2: {
    why: [
      { text: "In a closed cabin, exhaled CO₂ must be removed by machines, and local pockets can form where air does not move. NASA sets a 1-hour average of 3 mmHg or less.", sources: ["F-N14"] },
    ],
    now: {
      normal: [{ text: "Keep wearing your personal CO₂ monitor: fixed sensors miss local fluctuations.", sources: ["F-N14"] }],
      drift: [
        { text: "Check the area and the CO₂ removal system, and tell the crew.", sources: ["F-N14"] },
        { text: "NASA notes that diet changes can lower the CO₂ the crew produces.", sources: ["F-N14"] },
      ],
      alert: [{ text: "Check the area and the CO₂ removal system now, and alert the crew.", sources: ["F-N14"] }],
    },
    escalate: [
      { text: "Headache, fatigue, poor sleep or nausea, or readings above 3 mmHg → check the area and the removal system and report it.", sources: ["F-N14"] },
    ],
    measure: [{ text: "Wear a personal CO₂ monitor: fixed cabin sensors do not capture local fluctuations.", sources: ["F-N14", "F-N06"] }],
  },
  strength: {
    why: [
      { text: "Without gravity, muscles and bones carry less load. NASA requires in-flight strength and aerobic capacity to stay at 80% or more of your pre-flight baseline.", sources: ["F-N02-fitness", "F-N15"] },
    ],
    now: {
      normal: [{ text: "Train strength and aerobic capacity 6–7 days a week, about 1.5 h per day, as crews do on the ISS.", sources: ["F-N02-fitness"] }],
      drift: [
        { text: "Resistance exercise is an essential countermeasure for bone and muscle.", sources: ["F-N02-bone"] },
        { text: "Keep strength and aerobic training 6–7 days a week, about 1.5 h per day (ISS practice).", sources: ["F-N02-fitness"] },
      ],
    },
    escalate: [{ text: "Below 80% of your baseline → adjust the exercise plan with the CMO or with Earth.", sources: ["F-N15", "XM-RULE"] }],
    measure: [{ text: "Periodic self-assessment of strength and fitness; detailed protocol: no published source in our set yet.", sources: ["F-N06"] }],
  },
  nutrition: {
    why: [
      { text: "Far from Earth there is no quick resupply: food must stay safe, nutritious and varied to avoid menu fatigue.", sources: ["F-N02-food"] },
      { text: "NASA plans an average of 3,035 kcal per day (+200 kcal per spacewalk hour) and 100% of each person's calculated needs.", sources: ["F-N17", "F-N15"] },
    ],
    now: {
      normal: [{ text: "Log what you eat every day.", sources: ["F-N03-food"] }],
      drift: [
        { text: "Follow the diet prescribed for your mission and log your intake.", sources: ["F-N17", "F-N03-food"] },
        { text: "Use menu variety to fight menu fatigue.", sources: ["F-N02-food"] },
      ],
    },
    escalate: [
      { text: "Intake below your requirement or sustained weight loss → consult the CMO. NASA gives no numeric weight-loss limit.", sources: ["F-N15", "XM-RULE"] },
    ],
    measure: [
      { text: "Daily food log and a weekly menu questionnaire, as in NASA nutrition studies.", sources: ["F-N03-food"] },
      { text: "Weighing technique: no published source in our set yet.", sources: [] },
    ],
  },
};

export function actionsFor(id: IndicatorId, status: Status): Line[] {
  const g = GUIDE[id];
  if (status === "alert") return g.now.alert ?? g.now.drift;
  return status === "drift" ? g.now.drift : g.now.normal;
}

// ---- Emergency: chest pain and collapse (scenario of the challenge video) ----
// Skeleton from docs/base-conocimiento/13 §1.6. "Call 911" in the sources is
// adapted to "alert the crew and the CMO" (team adaptation). No medication.
export interface EmergencyStep {
  n: number;
  branch: "check" | "responds" | "unresponsive" | "report";
  title: string;
  text: string;
  sources: SourceId[];
}

export const EMERGENCY_STEPS: EmergencyStep[] = [
  { n: 1, branch: "check", title: "Do they respond?", text: "Tap their shoulder and ask loudly if they are OK.", sources: ["F-M01"] },
  { n: 2, branch: "responds", title: "Responds, with symptoms", text: "Chest pain or pressure that may spread to the jaw, arm or back; cold sweat; shortness of breath; nausea. Alert the crew and the Crew Medical Officer (CMO). Help them rest and stay calm, loosen tight clothing and do not leave them alone. Do not let them talk you out of getting help.", sources: ["F-M02"] },
  { n: 3, branch: "responds", title: "Message Earth — do not wait", text: "Send a store-and-forward message to the flight surgeon now. Keep acting on board: a reply can take up to 40 minutes (round trip).", sources: ["F-N15", "XM-RULE"] },
  { n: 4, branch: "unresponsive", title: "No response: get help and the AED", text: "Call the crew and bring the spacecraft's automated external defibrillator (AED), without leaving them alone.", sources: ["F-M01"] },
  { n: 5, branch: "unresponsive", title: "Check breathing", text: "Open the airway (tilt the head, lift the chin). Look, listen and feel for breathing for a few seconds.", sources: ["F-M01"] },
  { n: 6, branch: "unresponsive", title: "Not breathing: start CPR", text: "30 chest compressions (about 5 cm deep, 100–120 per minute) and 2 breaths. In microgravity the ISS protocol uses the “handstand” technique, bracing your legs against the wall. Use the AED as soon as it arrives.", sources: ["F-M01", "F-M03"] },
  { n: 7, branch: "unresponsive", title: "Keep going, swap every 2 minutes", text: "Swap rescuers every 2 minutes. Continue until breathing returns or trained help takes over.", sources: ["F-M01"] },
  { n: 8, branch: "report", title: "Report to Earth", text: "Write what happened and when, and send it store-and-forward to the flight surgeon.", sources: ["F-N15", "XM-RULE"] },
];
