// Cited sources. IDs match docs/REGISTRO-DECLARACIONES.md (F-xx; sub-pages
// of a registry entry carry a suffix, e.g. F-N02-cardio). Every reference
// value and every guidance line in the app points here.

export type SourceId =
  | "F-N01" | "F-N02" | "F-N03" | "F-N05" | "F-N06" | "F-N07" | "F-N09" | "F-N12"
  | "F-N02-cardio" | "F-N02-behavior" | "F-N02-sleep" | "F-N02-radiation"
  | "F-N02-food" | "F-N02-fitness" | "F-N02-bone" | "F-N03-food"
  | "F-N14" | "F-N15" | "F-N16" | "F-N17"
  | "F-C01" | "F-C02"
  | "F-G01" | "F-G02" | "F-G03" | "F-G04"
  | "F-M01" | "F-M02" | "F-M03"
  | "XM-RULE";

export interface Source {
  id: SourceId;
  org: string;
  title: string;
  short: string;
  url: string;
  nasa: boolean;
}

const list: Source[] = [
  { id: "F-N01", org: "NASA HRP", short: "NASA · 5 Hazards", title: "5 Hazards of Human Spaceflight (Human Research Program)", url: "https://www.nasa.gov/hrp/hazards/", nasa: true },
  { id: "F-N02", org: "NASA HRP", short: "NASA · HRP Risks", title: "Risks of Human Spaceflight (Human Research Program)", url: "https://www.nasa.gov/hrp/risks/", nasa: true },
  { id: "F-N02-cardio", org: "NASA HRP", short: "NASA · Cardiovascular risk", title: "Risk of Cardiovascular Adaptations Contributing to Adverse Mission Performance and Health Outcomes", url: "https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/", nasa: true },
  { id: "F-N02-behavior", org: "NASA HRP", short: "NASA · Behavioral health risk", title: "Risk of Behavioral Conditions and Psychiatric Disorders", url: "https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/", nasa: true },
  { id: "F-N02-sleep", org: "NASA HRP", short: "NASA · Sleep risk", title: "Risk from Inadequate Sleep and Irregular Schedules", url: "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/", nasa: true },
  { id: "F-N02-radiation", org: "NASA HRP", short: "NASA · Radiation risk", title: "Risk of Radiation-Induced Cancers", url: "https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/", nasa: true },
  { id: "F-N02-food", org: "NASA HRP", short: "NASA · Food and nutrition risk", title: "Risk of Inadequate Food and Nutrition", url: "https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/", nasa: true },
  { id: "F-N02-fitness", org: "NASA HRP", short: "NASA · Fitness risk", title: "Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness", url: "https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/", nasa: true },
  { id: "F-N02-bone", org: "NASA HRP", short: "NASA · Bone risk", title: "Risk of Spaceflight-Induced Bone Changes", url: "https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/", nasa: true },
  { id: "F-N03", org: "NASA HRP", short: "NASA · HRP Research", title: "Ongoing HRP Research in Space", url: "https://www.nasa.gov/hrp/ongoing-hrp-research/", nasa: true },
  { id: "F-N03-food", org: "NASA", short: "NASA · Food Physiology study", title: "Enhanced diet may help astronauts adapt to spaceflight (Food Physiology)", url: "https://www.nasa.gov/missions/station/enhanced-diet-may-help-astronauts-adapt-to-spaceflight/", nasa: true },
  { id: "F-N05", org: "NASA", short: "NASA · Human Body in Space", title: "The Human Body in Space", url: "https://www.nasa.gov/humans-in-space/the-human-body-in-space/", nasa: true },
  { id: "F-N06", org: "NASA", short: "NASA · Standard Measures", title: "Spaceflight Standard Measures: characterizing how humans adapt in space", url: "https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space/", nasa: true },
  { id: "F-N07", org: "NASA", short: "NASA · Wearable Tech", title: "Wearable Tech for Space Station Research", url: "https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/", nasa: true },
  { id: "F-N09", org: "NASA JSC", short: "NASA · Space Radiation", title: "Space Radiation (Space Radiation Analysis Group, Johnson Space Center)", url: "https://www.nasa.gov/directorates/esdmd/hhp/space-radiation/", nasa: true },
  { id: "F-N12", org: "NASA", short: "NASA · OSDR", title: "NASA Open Science Data Repository (OSDR)", url: "https://science.nasa.gov/biological-physical/data/", nasa: true },
  { id: "F-N14", org: "NASA OCHMO", short: "NASA OCHMO-TB-004", title: "OCHMO Technical Brief: Carbon Dioxide (OCHMO-TB-004)", url: "https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/", nasa: true },
  { id: "F-N15", org: "NASA", short: "NASA-STD-3001 Vol. 1", title: "NASA-STD-3001 Volume 1, Crew Health, Revision C (2023)", url: "https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf", nasa: true },
  { id: "F-N16", org: "NASA OCHMO", short: "NASA OCHMO-TB-020", title: "OCHMO Technical Brief: Design for Ionizing Radiation Protection (OCHMO-TB-020, Rev E)", url: "https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf", nasa: true },
  { id: "F-N17", org: "NASA OCHMO", short: "NASA OCHMO-TB-013", title: "OCHMO Technical Brief: Food and Nutrition (OCHMO-TB-013)", url: "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-013-food-and-nutrition.pdf", nasa: true },
  { id: "F-C01", org: "Canadian Space Agency", short: "CSA · Radiation monitoring", title: "Monitoring radiation for astronaut health (2026)", url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp", nasa: false },
  { id: "F-C02", org: "Canadian Space Agency", short: "CSA · Science in space", title: "Why do we conduct science experiments in space?", url: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp", nasa: false },
  { id: "F-G01", org: "MedlinePlus (NIH)", short: "MedlinePlus · Pulse", title: "Pulse", url: "https://medlineplus.gov/ency/article/003399.htm", nasa: false },
  { id: "F-G02", org: "CDC", short: "CDC · Blood pressure", title: "About High Blood Pressure", url: "https://www.cdc.gov/high-blood-pressure/about/index.html", nasa: false },
  { id: "F-G03", org: "MedlinePlus (NIH)", short: "MedlinePlus · Body temperature", title: "Body temperature norms", url: "https://medlineplus.gov/ency/article/001982.htm", nasa: false },
  { id: "F-G04", org: "American Diabetes Association", short: "ADA · Standards of Care", title: "Standards of Care in Diabetes: Diagnosis and Classification", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12690183", nasa: false },
  { id: "F-M01", org: "MedlinePlus (NIH)", short: "MedlinePlus · Adult CPR", title: "CPR — adult and child after onset of puberty", url: "https://medlineplus.gov/ency/article/000013.htm", nasa: false },
  { id: "F-M02", org: "MedlinePlus (NIH)", short: "MedlinePlus · Heart attack first aid", title: "Heart attack first aid", url: "https://medlineplus.gov/ency/article/000063.htm", nasa: false },
  { id: "F-M03", org: "European Society of Cardiology", short: "ESC 2025 · CPR in microgravity", title: "Cardiac arrest in space: automatic chest compressions in microgravity (ESC Congress 2025 press release; preliminary manikin study)", url: "https://www.escardio.org/The-ESC/Press-Office/Press-releases/cardiac-arrest-in-space-new-research-shows-that-automatic-chest-compressions-are-more-effective-for-cpr-when-both-rescuer-and-patient-are-floating-in-microgravity", nasa: false },
  { id: "XM-RULE", org: "XionMetrical", short: "XionMetrical rule", title: "Traffic-light and escalation rule of this prototype (team design, not a clinical protocol)", url: "", nasa: false },
];

export const SOURCES: Record<SourceId, Source> = Object.fromEntries(list.map((s) => [s.id, s])) as Record<SourceId, Source>;
export const SOURCE_LIST: readonly Source[] = list;
