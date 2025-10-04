import { useEffect, useMemo, useRef, useState } from "react";
import { daysSinceEpochNow, maxOrbitAU, snapshotAtDays } from "./model";

type Props = {
  width?: number;
  height?: number;
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

export function SolarSystem({ width = 800, height = 600 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(40); // simulated days per real second
  const [scale, setScale] = useState(1); // UI scale multiplier
  const [tiltDeg, setTiltDeg] = useState(20); // degrees to tilt the ecliptic
  const [tDays, setTDays] = useState(() => daysSinceEpochNow());

  const padding = 40;
  const maxAU = useMemo(() => maxOrbitAU(), []);

  useAnimationFrame(
    dt => {
      if (!paused) setTDays(t => t + dt * speed);
    },
    true
  );

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

    // Draw orbits
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#888";
    snap.bodies.forEach(b => {
      if (!b.orbitRadiusAU) return;
      const r = b.orbitRadiusAU * pxPerAU;
      ctx.beginPath();
      // Elliptical orbit due to tilt (compress Y by cosT)
      ctx.ellipse(0, 0, r, r * cosT, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Draw bodies
    snap.bodies.forEach(b => {
      const x = b.xAU * pxPerAU;
      const y = b.yAU * pxPerAU * cosT; // apply tilt
      const r = b.drawRadiusPx;
      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Label slightly offset
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
  }, [tDays, speed, scale, tiltDeg, maxAU]);

  return (
    <div className="solar-wrap">
      <div className="controls">
        <button className="btn" onClick={() => setPaused(v => !v)}>{paused ? "Resume" : "Pause"}</button>
        <label className="ctrl">
          Speed: <input type="range" min={1} max={200} value={speed} onChange={e => setSpeed(Number(e.target.value))} />
          <span className="mono">{speed} d/s</span>
        </label>
        <label className="ctrl">
          Scale: <input type="range" min={0.3} max={10} step={0.1} value={scale} onChange={e => setScale(Number(e.target.value))} />
          <span className="mono">{scale.toFixed(2)}x</span>
        </label>
        <label className="ctrl">
          Tilt: <input type="range" min={0} max={80} step={1} value={tiltDeg} onChange={e => setTiltDeg(Number(e.target.value))} />
          <span className="mono">{tiltDeg}°</span>
        </label>
        <button className="btn" onClick={() => setTDays(daysSinceEpochNow())}>Now</button>
      </div>
      <canvas ref={canvasRef} width={width} height={height} className="solar-canvas" />
    </div>
  );
}

export default SolarSystem;
