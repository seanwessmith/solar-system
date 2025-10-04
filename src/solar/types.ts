export interface OrbitDef {
  // Semi-major axis in astronomical units (AU)
  aAU: number;
  // Orbital period in Earth days (sidereal)
  periodDays: number;
  // Eccentricity (0 = circle)
  e?: number;
  // Mean motion (deg/day). Used especially for hyperbolic objects
  // or when no period is available.
  meanMotionDegPerDay?: number;
  // Inclination (deg) relative to ecliptic (J2000)
  incDeg?: number;
  // Longitude of ascending node Ω (deg)
  ascNodeDeg?: number;
  // Argument of periapsis ω (deg)
  argPeriDeg?: number;
  // Optional: mean longitude L (deg) and longitude of perihelion ϖ (deg)
  // If provided, mean anomaly at epoch is M0 = L - ϖ.
  meanLongDeg?: number;
  longPeriDeg?: number;
  // Alternatively, provide mean anomaly at epoch directly (deg)
  meanAnomDegAtEpoch?: number;
  // Legacy: initial phase in radians (used only if no elements)
  phase?: number;
}

export interface BodyDef {
  id: string;
  name: string;
  color: string;
  // Visual radius for rendering (px at 1x scale)
  drawRadiusPx: number;
  // Physical radius in km (informational)
  radiusKm?: number;
  orbit?: OrbitDef; // undefined for the Sun
  isSun?: boolean;
}

export interface BodyState {
  id: string;
  name: string;
  color: string;
  drawRadiusPx: number;
  isSun?: boolean;
  // Position in AU in the ecliptic plane
  xAU: number;
  yAU: number;
  zAU?: number;
  // Orbit radius for convenience
  orbitRadiusAU?: number;
}

export interface SystemSnapshot {
  epochName: string;
  tDays: number; // days since epoch
  bodies: BodyState[];
}
