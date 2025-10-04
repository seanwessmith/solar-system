export interface OrbitDef {
  // Semi-major axis in astronomical units (AU)
  aAU: number;
  // Orbital period in Earth days
  periodDays: number;
  // Optional initial phase in radians (0 = periapsis on +x)
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
  // Orbit radius for convenience
  orbitRadiusAU?: number;
}

export interface SystemSnapshot {
  epochName: string;
  tDays: number; // days since epoch
  bodies: BodyState[];
}

