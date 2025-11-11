export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    // Extract path from Vercel dynamic route
    const pathSegments = req.query.path || [];
    const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
    
    // Build upstream URL
    let upstreamPath = '/fact_check/';
    if (path) {
      upstreamPath = `/fact_check/${path}${path.endsWith('/') ? '' : '/'}`;
    }
    
    const upstreamUrl = `http://62.72.22.223${upstreamPath}`;

    const init = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Handle request body for POST/PUT requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    console.log('Proxying to:', upstreamUrl, 'Method:', req.method);

    const upstream = await fetch(upstreamUrl, init);
    const text = await upstream.text();
    
    console.log('Upstream response status:', upstream.status);
    console.log('Upstream response text:', text.substring(0, 200));
    
    // Try to parse as JSON, otherwise return as text
    try {
      const json = JSON.parse(text);
      res.setHeader('Content-Type', 'application/json');
      return res.status(upstream.status).json(json);
    } catch {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(upstream.status).send(text);
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ 
      ok: false,
      error: err.message || 'Internal server error' 
    });
  }
}

