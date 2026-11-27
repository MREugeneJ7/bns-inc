export type SoundProfile = "warehouse" | "acid" | "trance";
export type LightPalette = "neon" | "acid" | "ultraviolet";

export const SOUNDS: {
  id: SoundProfile;
  name: string;
  detail: string;
  tag: string;
}[] = [
  {
    id: "warehouse",
    name: "Warehouse",
    detail: "Heavy kicks. Raw synths.",
    tag: "TECHNO",
  },
  {
    id: "acid",
    name: "Acid 303",
    detail: "Rubbery bass. Resonant leads.",
    tag: "ACID",
  },
  {
    id: "trance",
    name: "Afterglow",
    detail: "Wide supersaws. Dreamy echoes.",
    tag: "TRANCE",
  },
];

export const LIGHTS: {
  id: LightPalette;
  name: string;
  detail: string;
  colors: string[];
  rgb: string[];
}[] = [
  {
    id: "neon",
    name: "Neon rush",
    detail: "HOT PINK / CYAN",
    colors: ["#ff43d0", "#47eeff"],
    rgb: ["255, 67, 208", "71, 238, 255"],
  },
  {
    id: "acid",
    name: "Acid laser",
    detail: "ELECTRIC LIME / VIOLET",
    colors: ["#ccff47", "#af74ff"],
    rgb: ["204, 255, 71", "175, 116, 255"],
  },
  {
    id: "ultraviolet",
    name: "Ultraviolet",
    detail: "DEEP VIOLET / ICE BLUE",
    colors: ["#b480ff", "#82baff"],
    rgb: ["180, 128, 255", "130, 186, 255"],
  },
];
