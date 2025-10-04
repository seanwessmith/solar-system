import { fetchSbdbOrbit } from "../src/sbdb";
import { stateForBody, daysSinceEpochFromDate } from "../src/solar/model";
import { BODIES } from "../src/solar/constants";

function distAU(a: { xAU: number; yAU: number; zAU?: number }, b: { xAU: number; yAU: number; zAU?: number }) {
  const dz = (a.zAU ?? 0) - (b.zAU ?? 0);
  const dx = a.xAU - b.xAU;
  const dy = a.yAU - b.yAU;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

async function main() {
  const date = new Date(Date.UTC(2025, 9, 3, 12, 0, 0)); // 2025-10-03T12:00Z
  const mars = BODIES.find(b => b.id === "mars")!;
  const atlas = await fetchSbdbOrbit("3I/ATLAS");

  const AU_KM = 149_597_870.7;
  const printAt = (d: Date) => {
    const t = daysSinceEpochFromDate(d);
    const m = stateForBody(mars, t);
    const a = stateForBody(atlas, t);
    const dAU = distAU(m, a);
    console.log(`${d.toISOString()} => ${dAU.toFixed(6)} AU (${(dAU*AU_KM/1e6).toFixed(2)} Mkm)`);
    return dAU;
  };

  console.log(`Resolved SBDB object: will plot whatever '3I/ATLAS' maps to`);
  printAt(date);

  // Scan +/- 30 days for minimum distance
  let best = { d: Infinity, when: new Date(date) };
  for (let dt = -30; dt <= 30; dt++) {
    const d = new Date(Date.UTC(2025, 9, 3 + dt, 12, 0, 0));
    const dd = printAt(d);
    if (dd < best.d) best = { d: dd, when: d };
  }
  console.log(`Closest in +/-30d window: ${best.when.toISOString()}  ${best.d.toFixed(6)} AU (${(best.d*AU_KM/1e6).toFixed(2)} Mkm)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
