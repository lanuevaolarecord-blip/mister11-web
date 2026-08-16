/**
 * /api/proxy-image.js
 * Vercel Serverless Function — Proxy de imágenes para evitar bloqueos de CORS.
 * Permite descargar imágenes de Firebase Storage u otros orígenes en formato DataURL Base64.
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = req.query.url || (req.body && req.body.url);
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: 'URL requerida' });
  }

  try {
    const targetUrl = decodeURIComponent(rawUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mister11-PDF-Generator/1.0'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'No se pudo obtener la imagen' });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).json({ dataUrl, contentType });
  } catch (error) {
    console.error('[proxy-image] Error:', error);
    return res.status(500).json({ error: 'Error al procesar la imagen' });
  }
}
