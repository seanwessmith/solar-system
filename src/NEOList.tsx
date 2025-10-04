import { useEffect, useMemo, useState } from "react";

type NeoItem = {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date_full?: string;
    close_approach_date: string;
    epoch_date_close_approach?: number;
    relative_velocity: { kilometers_per_second: string };
    miss_distance: { astronomical: string; lunar: string; kilometers: string };
    orbiting_body: string;
  }>;
};

function fmtISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function NEOList({ onPlot }: { onPlot?: (sstr: string) => void }) {
  const [date, setDate] = useState(() => fmtISODate(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NeoItem[]>([]);
  const [sstr, setSstr] = useState("3I/ATLAS");

  const prevDay = useMemo(() => {
    const d = new Date(date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    return fmtISODate(d);
  }, [date]);

  const nextDay = useMemo(() => {
    const d = new Date(date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    return fmtISODate(d);
  }, [date]);

  useEffect(() => {
    let aborted = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/neo/feed?start=${date}&end=${date}`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }
        const data = await res.json();
        const byDate = data.near_earth_objects as Record<string, NeoItem[]>;
        const list = (byDate?.[date] ?? []).slice();
        // sort by closest miss distance
        list.sort((a, b) => {
          const ma = Number(a.close_approach_data?.[0]?.miss_distance?.astronomical ?? Infinity);
          const mb = Number(b.close_approach_data?.[0]?.miss_distance?.astronomical ?? Infinity);
          return ma - mb;
        });
        if (!aborted) setItems(list);
      } catch (e: any) {
        if (!aborted) setError(String(e));
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, [date]);

  return (
    <div className="neo-panel">
      <div className="neo-controls">
        <label className="ctrl">Plot SBDB object:&nbsp;
          <input
            type="text"
            value={sstr}
            placeholder="e.g. 3I/ATLAS, 1I/2017 U1, 433 Eros"
            onChange={e => setSstr(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && onPlot) {
                const v = sstr.trim();
                if (v) onPlot(v);
              }
            }}
          />
        </label>
        <button
          className="btn"
          onClick={() => {
            if (onPlot) onPlot(sstr.trim() || '3I/ATLAS');
          }}
        >Plot</button>
      </div>
      <div className="neo-controls">
        <button className="btn" onClick={() => setDate(prevDay)}>&larr;</button>
        <label className="ctrl">Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <button className="btn" onClick={() => setDate(nextDay)}>&rarr;</button>
      </div>
      {loading && <div>Loading NEOs…</div>}
      {error && <div style={{ color: "#ffb3b3" }}>Error: {error}</div>}
      {!loading && !error && (
        <div className="neo-list">
          <div className="neo-summary">NEOs on {date}: {items.length}</div>
          {items.slice(0, 12).map(neo => {
            const approach = neo.close_approach_data[0];
            const missAU = Number(approach?.miss_distance?.astronomical ?? NaN);
            const missLD = Number(approach?.miss_distance?.lunar ?? NaN);
            const vkmps = Number(approach?.relative_velocity?.kilometers_per_second ?? NaN);
            const when = approach?.close_approach_date_full || approach?.close_approach_date;
            return (
              <div className="neo-item" key={neo.id}>
                <span className="neo-name">{neo.name}</span>
                {neo.is_potentially_hazardous_asteroid && <span className="neo-hazard">PHA</span>}
                <span className="neo-meta">miss: {isFinite(missAU) ? missAU.toFixed(4) : "?"} AU ({isFinite(missLD) ? missLD.toFixed(1) : "?"} LD)</span>
                <span className="neo-meta">v: {isFinite(vkmps) ? vkmps.toFixed(1) : "?"} km/s</span>
                <span className="neo-meta">when: {when}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NEOList;
