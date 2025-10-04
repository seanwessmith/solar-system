import React from "react";
import "./index.css";

import { useState } from "react";
import { SolarSystem } from "./solar/SolarSystem";
import { NEOList } from "./NEOList";
import type { BodyDef } from "./solar/types";

export function App() {
  const [overlays, setOverlays] = useState<BodyDef[]>([]);
  const [cmdSeq, setCmdSeq] = useState(0);
  const [cmd, setCmd] = useState<{ focusId?: string; jumpISO?: string; clearTrails?: boolean } | undefined>();

  const plotSbdb = async (sstr: string) => {
    try {
      const res = await fetch(
        `/api/sbdb/orbit?sstr=${encodeURIComponent(sstr)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body: BodyDef = await res.json();
      setOverlays((prev) => {
        const idx = prev.findIndex((b) => b.id === body.id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = body;
          return next;
        }
        return [...prev, body];
      });
      // After plotting, focus the camera on the object.
      // If it's C/2025 N1 (ATLAS), also jump to the close-approach date and clear trails.
      const name = (body.name || "").toLowerCase();
      const shouldJump = name.includes("atlas") && name.includes("2025 n1");
      const nextCmd: { focusId?: string; jumpISO?: string; clearTrails?: boolean } = { focusId: body.id };
      if (shouldJump) {
        nextCmd.jumpISO = "2025-10-03";
        nextCmd.clearTrails = true;
      }
      setCmd(nextCmd);
      setCmdSeq((s) => s + 1);
    } catch (e) {
      console.error(e);
      alert(`Failed to plot ${sstr}: ${e}`);
    }
  };

  return (
    <div className="app">
      <h1>Solar System Simulator</h1>
      <SolarSystem
        width={900}
        height={600}
        overlays={overlays}
        command={cmd}
        commandSeq={cmdSeq}
        onRemoveOverlay={(id) => setOverlays((prev) => prev.filter((b) => b.id !== id))}
      />

      <h2>Near-Earth Objects</h2>
      <NEOList onPlot={plotSbdb} />
    </div>
  );
}

export default App;
