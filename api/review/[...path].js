export default async function handler(req, res) {
  try {
    // Extract path from Vercel dynamic route
    const pathSegments = req.query.path || [];
    const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

    // Build upstream URL - fact_check/compose_news or fact_check/compose_tweet
    const endpoint = path ? `fact_check/${path}/` : 'fact_check/';

    const upstream = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method === "GET" ? undefined : JSON.stringify(req.body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}

