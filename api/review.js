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
      init.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(upstreamUrl, init);
    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = text;
    }

    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}
