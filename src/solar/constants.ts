import type { BodyDef } from "./types";

// J2000 epoch is commonly used in astronomy; we don't need exact accuracy,
// but keeping a named epoch helps align client and server.
export const J2000_EPOCH_MS = Date.UTC(2000, 0, 1, 12, 0, 0); // 2000-01-01 12:00:00Z
export const MS_PER_DAY = 86_400_000;

// Basic, near-circular orbital model parameters for a simple visualization.
// Distances are in AU, periods are in Earth days. Phases are arbitrary.
export const BODIES: BodyDef[] = [
  {
    id: "sun",
    name: "Sun",
    color: "#FDB813",
    drawRadiusPx: 12,
    radiusKm: 696_340,
    isSun: true,
  },
  {
    id: "mercury",
    name: "Mercury",
    color: "#b1b1b1",
    drawRadiusPx: 3,
    radiusKm: 2_440,
    orbit: {
      aAU: 0.38709893,
      periodDays: 87.9691,
      e: 0.20563069,
      incDeg: 7.00487,
      ascNodeDeg: 48.33167,
      // ϖ = 77.45645, so ω = ϖ - Ω
      argPeriDeg: 29.12478,
      meanLongDeg: 252.25084,
      longPeriDeg: 77.45645,
    },
  },
  {
    id: "venus",
    name: "Venus",
    color: "#e6d2a2",
    drawRadiusPx: 4,
    radiusKm: 6_052,
    orbit: {
      aAU: 0.72333199,
      periodDays: 224.70069,
      e: 0.00677323,
      incDeg: 3.39471,
      ascNodeDeg: 76.68069,
      argPeriDeg: 54.85229,
      meanLongDeg: 181.97973,
      longPeriDeg: 131.53298,
    },
  },
  {
    id: "earth",
    name: "Earth",
    color: "#4da6ff",
    drawRadiusPx: 5,
    radiusKm: 6_371,
    orbit: {
      aAU: 1.00000011,
      periodDays: 365.256363,
      e: 0.01671022,
      incDeg: 0.00005,
      // Ω sometimes listed negative; wrap to [0,360)
      ascNodeDeg: 348.73936, // -11.26064 + 360
      argPeriDeg: 114.20783, // ϖ - Ω with ϖ=102.94719
      meanLongDeg: 100.46435,
      longPeriDeg: 102.94719,
    },
  },
  {
    id: "mars",
    name: "Mars",
    color: "#e07a5f",
    drawRadiusPx: 4,
    radiusKm: 3_390,
    orbit: {
      aAU: 1.52366231,
      periodDays: 686.97959,
      e: 0.09341233,
      incDeg: 1.85061,
      ascNodeDeg: 49.57854,
      argPeriDeg: 286.46230,
      meanLongDeg: 355.45332,
      longPeriDeg: 336.04084,
    },
  },
  {
    id: "jupiter",
    name: "Jupiter",
    color: "#d2b48c",
    drawRadiusPx: 7,
    radiusKm: 69_911,
    orbit: {
      aAU: 5.20336301,
      periodDays: 4332.8201,
      e: 0.04839266,
      incDeg: 1.30530,
      ascNodeDeg: 100.55615,
      argPeriDeg: 274.19770,
      meanLongDeg: 34.40438,
      longPeriDeg: 14.75385,
    },
  },
  {
    id: "saturn",
    name: "Saturn",
    color: "#f4e3b2",
    drawRadiusPx: 6,
    radiusKm: 58_232,
    orbit: {
      aAU: 9.53707032,
      periodDays: 10759.221,
      e: 0.05415060,
      incDeg: 2.48446,
      ascNodeDeg: 113.71504,
      argPeriDeg: 338.71690,
      meanLongDeg: 49.94432,
      longPeriDeg: 92.43194,
    },
  },
  {
    id: "uranus",
    name: "Uranus",
    color: "#a6e3e9",
    drawRadiusPx: 5,
    radiusKm: 25_362,
    orbit: {
      aAU: 19.19126393,
      periodDays: 30685.4,
      e: 0.04716771,
      incDeg: 0.76986,
      ascNodeDeg: 74.22988,
      argPeriDeg: 96.73436,
      meanLongDeg: 313.23218,
      longPeriDeg: 170.96424,
    },
  },
  {
    id: "neptune",
    name: "Neptune",
    color: "#4f8cc3",
    drawRadiusPx: 5,
    radiusKm: 24_622,
    orbit: {
      aAU: 30.06896348,
      periodDays: 60190,
      e: 0.00858587,
      incDeg: 1.76917,
      ascNodeDeg: 131.72169,
      argPeriDeg: 273.24966,
      meanLongDeg: 304.88003,
      longPeriDeg: 44.97135,
    },
  },
];
