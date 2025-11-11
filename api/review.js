async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      if (!data) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(data);
      }
    });

    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  try {
    const upstreamPath = req.url.replace(/^\/api\/review/, '/fact_check');
    const upstreamUrl = new URL(upstreamPath, 'http://62.72.22.223');

    const init = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      let body = req.body;
      if (body === undefined) {
        body = await readRequestBody(req);
      }

      if (body && typeof body !== 'string') {
        init.body = JSON.stringify(body);
      } else if (typeof body === 'string') {
        init.body = body;
      } else {
        init.body = JSON.stringify({});
      }
    }

    const upstream = await fetch(upstreamUrl, init);
    const text = await upstream.text();

    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}
