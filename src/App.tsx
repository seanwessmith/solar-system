import React from "react";
import { APITester } from "./APITester";
import "./index.css";

import { SolarSystem } from "./solar/SolarSystem";
import { NEOList } from "./NEOList";
import type { BodyDef } from "./solar/types";

export function App() {
  const [overlays, setOverlays] = React.useState<BodyDef[]>([]);

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
    } catch (e) {
      console.error(e);
      alert(`Failed to plot ${sstr}: ${e}`);
    }
  };

  return (
    <div className="app">
      <h1>Solar System Simulator</h1>
      <SolarSystem width={900} height={600} overlays={overlays} />

      <h2>Near-Earth Objects</h2>
      <NEOList onPlot={plotSbdb} />
    </div>
  );
}

export default App;
