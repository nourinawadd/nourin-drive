export type Pet = {
  id: string;
  label: string;
  blurb: string;
};

export const PET_IDS = ["cat", "duck", "crab"] as const;
export type PetId = (typeof PET_IDS)[number];

export const PET_RANDOM = "random";
export const PET_OFF = "off";

export const PETS: Pet[] = [
  {
    id: PET_RANDOM,
    label: "Surprise Me",
    blurb: "A different one turns up each time you load the desktop.",
  },
  {
    id: "cat",
    label: "Cat",
    blurb: "Pads about, sits down without warning, sleeps most of the afternoon.",
  },
  {
    id: "duck",
    label: "Duck",
    blurb: "Waddles the whole length of a titlebar and bobs at nothing in particular.",
  },
  {
    id: "crab",
    label: "Crab",
    blurb: "Sidesteps everywhere, waves a claw, refuses to walk forwards.",
  },
  {
    id: PET_OFF,
    label: "Off",
    blurb: "No pet. The desktop stays yours alone.",
  },
];

export type DelayChoice = { seconds: number; label: string };

export const DELAY_CHOICES: DelayChoice[] = [
  { seconds: 60, label: "1 min" },
  { seconds: 180, label: "3 min" },
  { seconds: 300, label: "5 min" },
  { seconds: 600, label: "10 min" },
];

export const DEFAULT_PET = PET_RANDOM;
export const DEFAULT_DELAY = 180;

export function findPet(id: string): Pet | undefined {
  return PETS.find((p) => p.id === id);
}

export function findDelay(seconds: number): DelayChoice | undefined {
  return DELAY_CHOICES.find((d) => d.seconds === seconds);
}

export function rollPet(pinned: string, rng: () => number = Math.random): PetId | null {
  if (pinned === PET_OFF || !findPet(pinned)) return null;
  if (pinned === PET_RANDOM) return PET_IDS[Math.floor(rng() * PET_IDS.length) % PET_IDS.length];
  return pinned as PetId;
}
