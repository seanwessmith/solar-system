import { BODIES, J2000_EPOCH_MS, MS_PER_DAY } from "./constants";
import type { BodyDef, BodyState, SystemSnapshot } from "./types";

const TAU = Math.PI * 2;
const K_RAD_PER_DAY = 0.01720209895; // Gaussian gravitational constant

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

function normAngle(a: number): number {
  a = a % TAU;
  return a < 0 ? a + TAU : a;
}

function meanAnomalyAtEpoch(def: BodyDef): number | undefined {
  const o = def.orbit!;
  if (o.meanAnomDegAtEpoch != null) return degToRad(o.meanAnomDegAtEpoch);
  if (o.meanLongDeg != null && o.longPeriDeg != null) {
    return degToRad(o.meanLongDeg - o.longPeriDeg);
  }
  return undefined;
}

function solveKepler(M: number, e: number): number {
  // Newton-Raphson iteration for E - e sin E = M
  let E = M;
  if (e > 0.8) E = Math.PI; // better starting guess for high e
  for (let i = 0; i < 8; i++) {
    const f = E - e * Math.sin(E) - M;
    const f1 = 1 - e * Math.cos(E);
    const dE = -f / f1;
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

function solveKeplerHyperbolic(M: number, e: number): number {
  // Solve e*sinh H - H = M for H
  let H = Math.log(2 * Math.abs(M) / e + 1); // heuristic start
  if (M < 0) H = -H;
  for (let i = 0; i < 20; i++) {
    const sH = Math.sinh(H);
    const cH = Math.cosh(H);
    const f = e * sH - H - M;
    const f1 = e * cH - 1;
    const dH = -f / f1;
    H += dH;
    if (Math.abs(dH) < 1e-10) break;
  }
  return H;
}

export function stateForBody(def: BodyDef, tDays: number): BodyState {
  if (!def.orbit || def.isSun) {
    return {
      id: def.id,
      name: def.name,
      color: def.color,
      drawRadiusPx: def.drawRadiusPx,
      isSun: def.isSun,
      xAU: 0,
      yAU: 0,
      zAU: 0,
    };
  }

  const o = def.orbit;
  const a = o.aAU;
  const e = o.e ?? 0;
  const i = degToRad(o.incDeg ?? 0);
  const Ω = degToRad(o.ascNodeDeg ?? 0);
  const ω = degToRad(o.argPeriDeg ?? 0);
  const aAbs = Math.abs(a);
  // Base mean motion in rad/day
  const nBase = o.meanMotionDegPerDay != null
    ? degToRad(o.meanMotionDegPerDay)
    : (o.periodDays ? TAU / o.periodDays : K_RAD_PER_DAY / Math.pow(aAbs, 1.5));

  const M0 = meanAnomalyAtEpoch(def);
  if (M0 == null && !(e >= 1 && o.tpJD != null)) {
    // Fallback to circular uniform motion if insufficient elements
    const theta = normAngle((tDays * nBase) + (o.phase ?? 0));
    return {
      id: def.id,
      name: def.name,
      color: def.color,
      drawRadiusPx: def.drawRadiusPx,
      xAU: a * Math.cos(theta),
      yAU: a * Math.sin(theta),
      zAU: 0,
      orbitRadiusAU: a,
    };
  }

  let r: number, ν: number;
  if (e < 1) {
    // Elliptical: wrap M to [0, 2π)
    const M = normAngle((M0 ?? 0) + nBase * tDays);
    const E = solveKepler(M, e);
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const sqrt1me2 = Math.sqrt(1 - e * e);
    ν = Math.atan2(sqrt1me2 * sinE, cosE - e);
    r = a * (1 - e * cosE);
  } else {
    // Hyperbolic: prefer time from perihelion using tpJD
    const tSincePeriDays = o.tpJD != null ? (tDays - (o.tpJD - 2451545.0)) : tDays;
    const nH = K_RAD_PER_DAY / Math.pow(aAbs, 1.5); // rad/day
    const M = (M0 != null && o.tpJD == null) ? (M0 + nBase * tDays) : (nH * tSincePeriDays);
    const H = solveKeplerHyperbolic(M, e);
    const cH = Math.cosh(H);
    const sH = Math.sinh(H);
    r = aAbs * (e * cH - 1);
    const tanHalfNu = Math.sqrt((e + 1) / (e - 1)) * Math.tanh(H / 2);
    ν = 2 * Math.atan(tanHalfNu);
  }

  const u = ω + ν; // argument of latitude
  const cosu = Math.cos(u);
  const sinu = Math.sin(u);
  const cosΩ = Math.cos(Ω);
  const sinΩ = Math.sin(Ω);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);

  const x = r * (cosΩ * cosu - sinΩ * sinu * cosi);
  const y = r * (sinΩ * cosu + cosΩ * sinu * cosi);
  const z = r * (sinu * sini);

  return {
    id: def.id,
    name: def.name,
    color: def.color,
    drawRadiusPx: def.drawRadiusPx,
    xAU: x,
    yAU: y,
    zAU: z,
    orbitRadiusAU: a,
  };
}

export function snapshotAtDays(daysSinceEpoch: number): SystemSnapshot {
  const bodies = BODIES.map(b => stateForBody(b, daysSinceEpoch));
  return { epochName: "J2000", tDays: daysSinceEpoch, bodies };
}

export function daysSinceEpochFromDate(date: Date): number {
  return (date.getTime() - J2000_EPOCH_MS) / MS_PER_DAY;
}

export function daysSinceEpochNow(): number {
  return daysSinceEpochFromDate(new Date());
}

export function maxOrbitAU(): number {
  return BODIES.reduce((m, b) => (b.orbit ? Math.max(m, b.orbit.aAU) : m), 0);
}

export { BODIES };
