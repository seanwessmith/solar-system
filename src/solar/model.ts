import { BODIES, J2000_EPOCH_MS, MS_PER_DAY } from "./constants";
import type { BodyDef, BodyState, SystemSnapshot } from "./types";

export function angleAt(days: number, periodDays: number, phase = 0): number {
  return ((days / periodDays) * Math.PI * 2 + phase) % (Math.PI * 2);
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
    };
  }

  const { aAU, periodDays, phase } = def.orbit;
  const theta = angleAt(tDays, periodDays, phase);
  const xAU = aAU * Math.cos(theta);
  const yAU = aAU * Math.sin(theta);

  return {
    id: def.id,
    name: def.name,
    color: def.color,
    drawRadiusPx: def.drawRadiusPx,
    xAU,
    yAU,
    orbitRadiusAU: aAU,
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

