const BASE = "https://api.nasa.gov/neo/rest/v1";

function apiKey(): string {
  const key = process.env.NASA_API_KEY || process.env.BUN_PUBLIC_NASA_API_KEY;
  if (!key) return "DEMO_KEY"; // fallback with strict rate limits
  return key;
}

export async function fetchNeoFeed(start: string, end?: string) {
  const params = new URLSearchParams({ start_date: start, api_key: apiKey() });
  if (end) params.set("end_date", end);
  const url = `${BASE}/feed?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NASA feed error ${res.status}`);
  return res.json();
}

export async function fetchNeoById(id: string) {
  const url = `${BASE}/neo/${encodeURIComponent(id)}?api_key=${apiKey()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NASA lookup error ${res.status}`);
  return res.json();
}

export async function fetchNeoFeedRaw(
  start: string,
  end?: string
): Promise<Response> {
  const params = new URLSearchParams({ start_date: start, api_key: apiKey() });
  if (end) params.set("end_date", end);
  const url = `${BASE}/feed?${params.toString()}`;
  console.log("NASA feed URL:", url);
  return fetch(url);
}
