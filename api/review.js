export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    // Extract the path from the request URL
    // For Vercel: /api/review -> /fact_check/
    // For Vercel: /api/review/compose_news -> /fact_check/compose_news/
    const url = new URL(req.url, `http://${req.headers.host}`);
    let path = url.pathname.replace(/^\/api\/review/, '/fact_check');
    
    // Ensure trailing slash for base path
    if (path === '/fact_check') {
      path = '/fact_check/';
    }
    
    const upstreamUrl = `http://62.72.22.223${path}${url.search}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds (2 minutes)
    
    const init = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };

    // Handle request body for POST/PUT requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    try {
      const upstream = await fetch(upstreamUrl, init);
      clearTimeout(timeoutId);
      const text = await upstream.text();
      
      // Try to parse as JSON, otherwise return as text
      try {
        const json = JSON.parse(text);
        res.setHeader('Content-Type', 'application/json');
        return res.status(upstream.status).json(json);
      } catch {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(upstream.status).send(text);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout after 120 seconds');
      }
      throw fetchError;
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ 
      ok: false,
      error: err.message || 'Internal server error' 
    });
  }
}
