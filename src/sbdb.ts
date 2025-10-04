import type { BodyDef } from "./solar/types";

const SBDB_BASE = "https://ssd-api.jpl.nasa.gov/sbdb.api";
const JD_J2000 = 2451545.0;

type SBDBResponse = any;

function toNumber(x: any): number | undefined {
  if (x == null) return undefined;
  const n = typeof x === "string" ? parseFloat(x) : Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function parseElements(obj: any): Record<string, number> {
  const out: Record<string, number> = {};
  if (!obj) return out;
  // Case 1: elements as array of {name, value}
  if (Array.isArray(obj.elements)) {
    for (const e of obj.elements) {
      if (e && e.name != null && e.value != null) {
        const v = toNumber(e.value);
        if (v != null) out[e.name] = v;
      }
    }
  }
  // Case 2: flat keys (e, a, i, om, w, ma, n, per, epoch, tp)
  const keys = ["e", "a", "i", "om", "w", "ma", "n", "per", "epoch", "tp"];
  for (const k of keys) {
    const v = toNumber(obj[k]);
    if (v != null) out[k] = v;
  }
  // Alternative epoch field names
  if (obj.epoch_jd != null) out["epoch"] = toNumber(obj.epoch_jd)!;
  if (obj.epoch_tdb != null) out["epoch"] = toNumber(obj.epoch_tdb)!;
  if (obj.tp_jd != null) out["tp"] = toNumber(obj.tp_jd)!;
  if (obj.tp_tdb != null) out["tp"] = toNumber(obj.tp_tdb)!;
  return out;
}

function normDeg(d: number): number {
  d = d % 360;
  return d < 0 ? d + 360 : d;
}

export async function fetchSbdbOrbit(sstr: string): Promise<BodyDef> {
  const url = `${SBDB_BASE}?sstr=${encodeURIComponent(sstr)}&full-prec=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SBDB error ${res.status}`);
  const data: SBDBResponse = await res.json();

  const obj = data?.object ?? data?.data ?? {};
  const orbit = data?.orbit ?? data?.data?.orbit ?? data?.data ?? {};
  const elems = parseElements(orbit);

  // Fallback name/id
  const name: string = obj?.fullname || obj?.full_name || obj?.des || obj?.pdes || sstr;
  const id: string = obj?.spkid || obj?.id || name;

  const aAU = elems.a ?? toNumber(orbit.a) ?? 1;
  const e = elems.e ?? toNumber(orbit.e) ?? 0;
  const incDeg = elems.i ?? toNumber(orbit.i) ?? 0;
  const ascNodeDeg = elems.om ?? toNumber(orbit.om) ?? 0;
  const argPeriDeg = elems.w ?? toNumber(orbit.w) ?? 0;
  const ma = elems.ma ?? toNumber(orbit.ma); // deg at epoch
  const n = elems.n ?? toNumber(orbit.n); // deg/day
  const per = elems.per ?? toNumber(orbit.per); // days
  const epochJD = elems.epoch ?? toNumber(orbit.epoch) ?? JD_J2000;
  const tpJD = elems.tp ?? toNumber(orbit.tp);

  // Fallback mean motion using Gaussian gravitational constant if needed
  const K_RAD_PER_DAY = 0.01720209895; // Gaussian gravitational constant
  const K_DEG_PER_DAY = (K_RAD_PER_DAY * 180) / Math.PI;
  let nVal = n;
  if (nVal == null && aAU != null) {
    nVal = K_DEG_PER_DAY / Math.pow(Math.abs(aAU), 1.5);
  }

  let periodDays = per ?? (nVal ? 360 / nVal : 365.25);
  if (e >= 1) {
    // Period not defined; keep a dummy but store n via meanMotionDegPerDay
    if (!n) {
      // If we don't have n, try to infer from perihelion time difference; otherwise default to ~1 deg/day
      // This is just a placeholder to allow motion.
    }
  }

  // Compute mean anomaly at J2000
  let meanAnomDegAtEpoch: number | undefined;
  if (ma != null && nVal != null) {
    const dtDays = epochJD - JD_J2000;
    meanAnomDegAtEpoch = normDeg(ma - nVal * dtDays);
  } else if (tpJD != null && nVal != null) {
    // M(J2000) = n * (J2000 - tp)
    meanAnomDegAtEpoch = normDeg(nVal * (JD_J2000 - tpJD));
  } else if (ma != null) {
    meanAnomDegAtEpoch = normDeg(ma);
  }

  const body: BodyDef = {
    id: String(id),
    name,
    color: "#ff77cc",
    drawRadiusPx: 4,
    orbit: {
      aAU: aAU,
      periodDays: periodDays,
      e,
      incDeg,
      ascNodeDeg,
      argPeriDeg,
      meanAnomDegAtEpoch,
      meanMotionDegPerDay: nVal,
    },
  };

  return body;
}
