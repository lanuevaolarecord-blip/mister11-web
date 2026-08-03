/**
 * /api/ia-generate.js
 * Vercel Serverless Function — Proxy seguro para la IA Generadora de Míster 11.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * SEGURIDAD:
 *  • La clave de Groq vive en GROQ_API_KEY (variable de servidor en Vercel).
 *    Al no tener el prefijo VITE_, Vite NUNCA la incluye en el bundle del cliente.
 *  • El cliente solo envía el prompt y el tipo de modo — nunca toca la clave.
 *  • Se valida que el método sea POST y que el body tenga los campos mínimos.
 *  • Se aplica un límite de tamaño de prompt (8.000 caracteres) para prevenir
 *    abuso de tokens de Groq.
 * ──────────────────────────────────────────────────────────────────────────────
 */

export default async function handler(req, res) {
  // ── Solo se aceptan peticiones POST ──────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  // ── Leer clave del servidor (nunca del cliente) ───────────────────────────────
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    console.error('[ia-generate] GROQ_API_KEY no configurada en el servidor.');
    return res.status(500).json({ error: 'La IA no está disponible en este momento. Contacta al administrador.' });
  }

  // ── Validar body ───────────────────────────────────────────────────────────────
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "prompt" es obligatorio y debe ser una cadena de texto.' });
  }

  // Límite de seguridad: evitar prompts excesivamente largos
  if (prompt.length > 8000) {
    return res.status(400).json({ error: 'El prompt supera el límite de 8.000 caracteres.' });
  }

  // ── Llamar a la API de Groq desde el servidor ─────────────────────────────────
  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en metodología del fútbol formativo. Respondes siempre en español.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Error HTTP ${groqResponse.status} de Groq`;
      console.error('[ia-generate] Error de Groq:', errorMsg);
      return res.status(groqResponse.status).json({ error: errorMsg });
    }

    const data = await groqResponse.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(502).json({ error: 'Respuesta vacía de la IA. Intenta de nuevo.' });
    }

    // ── Devolver solo el texto generado al cliente ─────────────────────────────
    return res.status(200).json({ result: text });

  } catch (err) {
    console.error('[ia-generate] Error inesperado:', err);
    return res.status(500).json({ error: 'Error interno del servidor. Intenta de nuevo.' });
  }
}
