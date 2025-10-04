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
    orbit: { aAU: 0.39, periodDays: 88 },
  },
  {
    id: "venus",
    name: "Venus",
    color: "#e6d2a2",
    drawRadiusPx: 4,
    radiusKm: 6_052,
    orbit: { aAU: 0.72, periodDays: 224.7 },
  },
  {
    id: "earth",
    name: "Earth",
    color: "#4da6ff",
    drawRadiusPx: 5,
    radiusKm: 6_371,
    orbit: { aAU: 1.0, periodDays: 365.25 },
  },
  {
    id: "mars",
    name: "Mars",
    color: "#e07a5f",
    drawRadiusPx: 4,
    radiusKm: 3_390,
    orbit: { aAU: 1.52, periodDays: 686.98 },
  },
  {
    id: "jupiter",
    name: "Jupiter",
    color: "#d2b48c",
    drawRadiusPx: 7,
    radiusKm: 69_911,
    orbit: { aAU: 5.20, periodDays: 4332.82 },
  },
  {
    id: "saturn",
    name: "Saturn",
    color: "#f4e3b2",
    drawRadiusPx: 6,
    radiusKm: 58_232,
    orbit: { aAU: 9.58, periodDays: 10_759.22 },
  },
  {
    id: "uranus",
    name: "Uranus",
    color: "#a6e3e9",
    drawRadiusPx: 5,
    radiusKm: 25_362,
    orbit: { aAU: 19.20, periodDays: 30_688.5 },
  },
  {
    id: "neptune",
    name: "Neptune",
    color: "#4f8cc3",
    drawRadiusPx: 5,
    radiusKm: 24_622,
    orbit: { aAU: 30.05, periodDays: 60_182 },
  },
];

