import { useEffect, useMemo, useRef, useState } from "react";
import {
  BODIES,
  daysSinceEpochFromDate,
  daysSinceEpochNow,
  snapshotAtDays,
  stateForBody,
} from "./model";
import type { BodyDef } from "./types";
import { J2000_EPOCH_MS, MS_PER_DAY } from "./constants";

type Command = {
  focusId?: string;
  jumpISO?: string;
  clearTrails?: boolean;
};

type Props = {
  width?: number;
  height?: number;
  overlays?: BodyDef[];
  onRemoveOverlay?: (id: string) => void;
  command?: Command;
  commandSeq?: number;
};

function useAnimationFrame(callback: (dtSec: number) => void, active = true) {
  const lastRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = (t: number) => {
      const last = lastRef.current ?? t;
      lastRef.current = t;
      callback((t - last) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [callback, active]);
}

export function SolarSystem({
  width = 800,
  height = 600,
  overlays = [],
  onRemoveOverlay,
  command,
  commandSeq,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1); // simulated days per real second
  const [scale, setScale] = useState(1); // UI scale multiplier
  const [tiltDeg, setTiltDeg] = useState(20); // degrees to tilt the ecliptic
  const [tDays, setTDays] = useState(() => {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - 1);
    return daysSinceEpochFromDate(d);
  });
  const [dateInput, setDateInput] = useState<string>(() => {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [focusId, setFocusId] = useState<string | undefined>(undefined); // undefined = Sun at origin
  const trailsRef = useRef<
    Record<
      string,
      { pts: { x: number; y: number; z: number }[]; color: string }
    >
  >({});

  const padding = 40;
  const bodies = useMemo(() => [...BODIES, ...overlays], [overlays]);
  const maxAU = useMemo(
    () =>
      bodies.reduce(
        (m, b) => (b.orbit ? Math.max(m, Math.abs(b.orbit.aAU)) : m),
        0
      ),
    [bodies]
  );

  useEffect(() => {
    if (!command) return;
    if (command.focusId !== undefined) setFocusId(command.focusId || undefined);
    if (command.jumpISO) {
      setDateInput(command.jumpISO);
      const d = new Date(`${command.jumpISO}T12:00:00Z`);
      if (!isNaN(d.getTime())) setTDays(daysSinceEpochFromDate(d));
    }
    if (command.clearTrails) trailsRef.current = {};
  }, [commandSeq]);

  useAnimationFrame((dt) => {
    if (!paused) setTDays((t) => t + dt * speed);
  }, true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const snap = snapshotAtDays(tDays);

    // Compute pixels per AU so the largest orbit fits within the view.
    const fitRadius = Math.min(w, h) / 2 - padding;
    const pxPerAU = (fitRadius / maxAU) * scale;
    const cx = w / 2;
    const cy = h / 2;
    const tiltRad = (tiltDeg * Math.PI) / 180;
    const cosT = Math.cos(tiltRad);

    ctx.save();
    ctx.translate(cx, cy);

    // Camera focus: translate world so target is at origin
    const statesAll = bodies.map((b) => stateForBody(b, tDays));
    const centerState = focusId
      ? statesAll.find((s) => s.id === focusId)
      : undefined;
    const cam = {
      x: centerState?.xAU ?? 0,
      y: centerState?.yAU ?? 0,
      z: centerState?.zAU ?? 0,
    };

    // Draw orbits (sampled with elements, projected with tilt)
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#888";
    const SAMPLES = 256;
    bodies.forEach((def) => {
      const o = def.orbit;
      if (!o || def.isSun) return;
      const a = Math.abs(o.aAU);
      const e = o.e ?? 0;
      const i = ((o.incDeg ?? 0) * Math.PI) / 180;
      const Ω = ((o.ascNodeDeg ?? 0) * Math.PI) / 180;
      const ω = ((o.argPeriDeg ?? 0) * Math.PI) / 180;

      const cosΩ = Math.cos(Ω),
        sinΩ = Math.sin(Ω);
      const cosi = Math.cos(i),
        sini = Math.sin(i);

      ctx.beginPath();
      // Elliptical: full 0..2π, Hyperbolic: limited range around periapsis
      const startNu = e < 1 ? 0 : -Math.PI * 0.75;
      const endNu = e < 1 ? Math.PI * 2 : Math.PI * 0.75;
      for (let k = 0; k <= SAMPLES; k++) {
        const t = k / SAMPLES;
        const ν = startNu + t * (endNu - startNu);
        const r =
          e < 1
            ? (a * (1 - e * e)) / (1 + e * Math.cos(ν))
            : (a * (e * e - 1)) / (1 + e * Math.cos(ν));
        const u = ω + ν;
        const cosu = Math.cos(u),
          sinu = Math.sin(u);
        const x = r * (cosΩ * cosu - sinΩ * sinu * cosi) - cam.x;
        const y = r * (sinΩ * cosu + cosΩ * sinu * cosi) - cam.y;
        const z = r * (sinu * sini) - cam.z;
        const sx = x * pxPerAU;
        const sy = (y * cosT - z * Math.sin(tiltRad)) * pxPerAU;
        if (k === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Update trails for overlays and Mars
    const trailTargets = new Set<string>([
      "mars",
      ...overlays.map((o) => o.id),
    ]);
    const states = statesAll;
    states.forEach((s) => {
      if (!trailTargets.has(s.id)) return;
      const entry = (trailsRef.current[s.id] ??= { pts: [], color: s.color });
      entry.color = s.color;
      entry.pts.push({ x: s.xAU, y: s.yAU, z: s.zAU ?? 0 });
      const maxPts = 600;
      if (entry.pts.length > maxPts)
        entry.pts.splice(0, entry.pts.length - maxPts);
    });

    // Draw trails
    Object.entries(trailsRef.current).forEach(([id, tr]) => {
      if (!trailTargets.has(id) || tr.pts.length < 2) return;
      ctx.beginPath();
      for (let i = 0; i < tr.pts.length; i++) {
        const p = tr.pts[i];
        if (!p) continue;
        const sx = (p.x - cam.x) * pxPerAU;
        const sy =
          ((p.y - cam.y) * cosT - (p.z - cam.z) * Math.sin(tiltRad)) * pxPerAU;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = tr.color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    });

    // Draw bodies: planets + overlays with depth ordering
    const projected = states.map((b) => {
      const wx = b.xAU - cam.x;
      const wy = b.yAU - cam.y;
      const wz = (b.zAU ?? 0) - cam.z;
      const x = wx * pxPerAU;
      const y = (wy * cosT - wz * Math.sin(tiltRad)) * pxPerAU;
      const zPrime = wy * Math.sin(tiltRad) + wz * Math.cos(tiltRad);
      return { b, x, y, zPrime };
    });
    projected.sort((a, b) => a.zPrime - b.zPrime); // draw far to near
    projected.forEach(({ b, x, y }) => {
      const r = b.drawRadiusPx;
      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      if (!b.isSun) {
        ctx.fillStyle = "#fff";
        ctx.font = "12px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(b.name, x + r + 4, y);
      }
    });

    ctx.restore();

    // HUD text
    ctx.fillStyle = "#fbf0df";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Epoch: J2000`, 8, 16);
    ctx.fillText(`t = ${tDays.toFixed(1)} days`, 8, 32);
    ctx.fillText(`speed = ${speed.toFixed(0)} d/s`, 8, 48);
    ctx.fillText(`scale = ${scale.toFixed(2)}x`, 8, 64);
    ctx.fillText(`tilt = ${tiltDeg.toFixed(0)}°`, 8, 80);
    const simDate = new Date(J2000_EPOCH_MS + tDays * MS_PER_DAY);
    ctx.fillText(`UTC: ${simDate.toISOString().replace(".000Z", "Z")}`, 8, 96);
  }, [tDays, speed, scale, tiltDeg, maxAU, bodies]);

  return (
    <div className="solar-wrap">
      <div className="controls">
        <button className="btn" onClick={() => setPaused((v) => !v)}>
          {paused ? "Resume" : "Pause"}
        </button>
        <label className="ctrl">
          Speed:{" "}
          <input
            type="range"
            min={1}
            max={200}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span className="mono">{speed} d/s</span>
        </label>
        <label className="ctrl">
          Scale:{" "}
          <input
            type="range"
            min={0.3}
            max={500}
            step={0.1}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
          <span className="mono">{scale.toFixed(2)}x</span>
        </label>
        <label className="ctrl">
          Tilt:{" "}
          <input
            type="range"
            min={0}
            max={80}
            step={1}
            value={tiltDeg}
            onChange={(e) => setTiltDeg(Number(e.target.value))}
          />
          <span className="mono">{tiltDeg}°</span>
        </label>
        <button
          className="btn"
          onClick={() => {
            setTDays(daysSinceEpochNow());
            trailsRef.current = {};
          }}
        >
          Now
        </button>
        <label className="ctrl">
          Date:{" "}
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
        </label>
        <button
          className="btn"
          onClick={() => {
            if (!dateInput) return;
            const d = new Date(`${dateInput}T12:00:00Z`);
            if (isNaN(d.getTime())) return;
            setTDays(daysSinceEpochFromDate(d));
            // optional: clear trails when jumping
            trailsRef.current = {};
          }}
        >
          Go
        </button>
        <button
          className="btn"
          onClick={() => {
            setDateInput("2025-10-03");
            const d = new Date(`2025-10-03T12:00:00Z`);
            setTDays(daysSinceEpochFromDate(d));
            trailsRef.current = {};
          }}
        >
          2025-10-03
        </button>
        <button className="btn" onClick={() => (trailsRef.current = {})}>
          Clear Trails
        </button>
        <label className="ctrl">
          Focus:{" "}
          <select
            value={focusId ?? "sun"}
            onChange={(e) =>
              setFocusId(e.target.value === "sun" ? undefined : e.target.value)
            }
          >
            <option value="sun">Sun</option>
            <option value="earth">Earth</option>
            <option value="mars">Mars</option>
            {overlays.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="solar-canvas"
      />
      {overlays.length > 0 && (
        <div className="legend">
          {overlays.map((o) => (
            <div key={o.id} className="legend-item">
              <span
                className="legend-swatch"
                style={{ background: o.color }}
                title={o.color}
              />
              <span className="legend-name">{o.name}</span>
              <button
                className="legend-remove"
                title="Focus"
                onClick={() => setFocusId(o.id)}
              >
                ●
              </button>
              {onRemoveOverlay && (
                <button
                  className="legend-remove"
                  onClick={() => onRemoveOverlay(o.id)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SolarSystem;
