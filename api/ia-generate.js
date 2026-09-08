/**
 * /api/ia-generate.js
 * Vercel Serverless Function — Proxy seguro para la IA Generadora de Míster 11.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * PROTOCOLO DE IDIOMA ESTRICTO (ES/EN) Y CONTROL DE SALIDA:
 *  • La clave de Groq vive en GROQ_API_KEY (variable de servidor en Vercel).
 *  • Acepta { prompt, lang, mode } donde lang es 'es' o 'en'.
 *  • Primera línea del system prompt impone el idioma y prohíbe terminantemente
 *    razonamiento, thinking process, pasos de análisis ("1. Analyze...") y CoT.
 *  • Post-proceso cleanAndValidateOutput() que elimina preámbulos, etiquetas <think>,
 *    bloques de razonamiento y verifica coherencia de idioma mediante stopwords.
 *  • Reintento automático con directiva reforzada si se detecta discordancia.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const FALLBACK_ES = `## Ejercicio Táctico de Posesión y Apoyo
**Objetivo:** Mantener la posesión del balón bajo presión defensiva y mejorar las líneas de pase de apoyo diagonal.

### Ejercicios:
1. **Rondo 4v4+3 Comodines**
   - **Descripción:** Espacio delimitado de 20x20m. El equipo con posesión combina utilizando los comodines interiores mientras el equipo rival presiona en bloque.
   - **Series y repeticiones:** 4 series de 3 minutos (1 minuto de descanso activo entre series).
   - **Progresión:** Limitar a máximo 2 toques, y 1 toque para los comodines.

### Frecuencia sugerida: 2 veces por semana en fase preparatoria de partido.
### Notas para el entrenador: Enfatizar la orientación corporal antes de recibir y la reacción inmediata tras pérdida.`;

const FALLBACK_EN = `## Tactical Possession & Support Drill
**Objective:** Maintain ball possession under defensive pressure and improve diagonal support passing lines.

### Exercises:
1. **Rondo 4v4+3 Neutral Players**
   - **Description:** 20x20m grid. The attacking team maintains possession using neutral pivot players while defending team presses in blocks.
   - **Sets and Repetitions:** 4 sets of 3 minutes (1 min active recovery between sets).
   - **Progression:** Limit touches to 2 touches maximum, then 1 touch for neutral players.

### Suggested Frequency: 2 times per week during match preparation phase.
### Coach Notes: Emphasize body orientation before receiving and quick transition upon ball loss.`;

function cleanAndValidateOutput(rawText, targetLang) {
  if (!rawText || typeof rawText !== 'string') {
    return { text: '', isDiscordant: false };
  }

  // 1. Quitar etiquetas <think>...</think>
  let text = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim();

  // 2. Eliminar preámbulos y bloques de razonamiento (Chain of Thought) antes del contenido real
  // Estrategia A: eliminar cualquier bloque <think>…</think> residual que haya quedado anidado
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim();

  // Estrategia B: eliminar bloques de razonamiento completos antes del primer encabezado válido
  // Un encabezado válido es ## que NO sea de razonamiento (Analysis, Step 1, Thinking, etc.)
  const reasoningHeaderRegex = /^(?:#+\s*)?(?:Step\s*\d+|Paso\s*\d+|Thinking(?:\s*Process)?|Reasoning|Razonamiento|Chain\s*of\s*Thought|Analyze(?:\s*User\s*Input)?|Análisis|User\s*Input|Deconstruct|Context|Introduction|Overview)/i;

  const lines = text.split('\n');
  let firstValidHeaderLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^#{1,3}\s+/.test(trimmed)) {
      const headerTitle = trimmed.replace(/^#{1,3}\s+/, '').trim();
      if (!reasoningHeaderRegex.test(headerTitle)) {
        firstValidHeaderLine = i;
        break;
      }
    } else if (/^\*\*(?:Objetivo|Objective|Ejercicio|Drill|Nombre|Plan|Ficha)/i.test(trimmed)) {
      firstValidHeaderLine = i;
      break;
    }
  }

  if (firstValidHeaderLine > 0) {
    text = lines.slice(firstValidHeaderLine).join('\n').trim();
  }

  // 3. Eliminar líneas residuales de razonamiento / bullets de CoT si quedaran
  // Se aplican múltiples pases para capturar patrones que Qwen/reasoning-models suelen generar
  text = text
    // Bullets descriptivos de parámetros de entrada (CoT)
    .replace(/^[-*•]\s*(?:Role|Parameters|Drill Type|Sport|Age Group|Duration|Players|Level|Skill Focus|Analyze|Analysis|Input|Output|Step \d|Constraints|Key Elements|User Request|Language|Format)[^\n]*\n?/gim, '')
    // Pasos numerados de razonamiento
    .replace(/^\d+\.\s*(?:Analyze|Deconstruct|Design|Consider|Review|Think|Plan|Identify|Evaluate|User Input|Understand|Parse|Extract)[^\n]*\n?/gim, '')
    // Bloques multi-línea de intro de razonamiento (hasta el primer ## o ** real)
    .replace(/(?:^|\n)(?:Here'?s (?:a |my )?(?:thinking|analysis|approach|plan)|Thinking Process:?|Reasoning:?|Analyze User Input:?|Analysis:?|My approach:?|Let me (?:analyze|design|create|think)|I(?:'ll| will) (?:create|design|analyze|generate))[^\n]*(?:\n(?![#*\-])[^\n]*)*/gi, '')
    // Frases de arranque de generación
    .replace(/^(?:In this drill|Let's design|Okay, let's create|I will create|Sure, here|Certainly, here|Alright,)[^\n]*\n?/gim, '')
    // Etiquetas vacías de sección residuales (--- o *** solos)
    .replace(/^(?:---+|\*\*\*+)\s*\n/gm, '')
    // Colapsar múltiples saltos en uno doble
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 4. Verificación de idioma por stopwords
  const esStopwords = [' de ', ' la ', ' que ', ' el ', ' para ', ' con ', ' en ', ' un ', ' una ', ' los ', ' las ', ' del ', ' por '];
  const enStopwords = [' the ', ' of ', ' and ', ' for ', ' with ', ' to ', ' is ', ' in ', ' players ', ' drill ', ' ball '];

  const lower = ' ' + text.toLowerCase() + ' ';
  let esCount = 0;
  for (const sw of esStopwords) {
    if (lower.includes(sw)) esCount++;
  }
  let enCount = 0;
  for (const sw of enStopwords) {
    if (lower.includes(sw)) enCount++;
  }

  const isDiscordant = (targetLang === 'es' && enCount > esCount && enCount >= 4) ||
                       (targetLang === 'en' && esCount > enCount && esCount >= 4);

  return { text, isDiscordant, esCount, enCount };
}

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
  const { prompt, lang = 'es' } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "prompt" es obligatorio y debe ser una cadena de texto.' });
  }

  if (prompt.length > 8000) {
    return res.status(400).json({ error: 'El prompt supera el límite de 8.000 caracteres.' });
  }

  const targetLang = (lang === 'en' || lang === 'English (EN)') ? 'en' : 'es';

  // ── System Prompt con Regla de Oro de Idioma y Prohibición de Razonamiento ────
  const systemPrompt = targetLang === 'en'
    ? 'LANGUAGE LOCK: respond ONLY in English (en). Never output reasoning, thinking process, analysis steps, or text in any other language. All titles, steps, labels and explanations must be in English. You are a UEFA Pro licensed coach and elite youth football methodology expert. Start your output DIRECTLY with the exercise title using markdown ## [Drill Title], followed immediately by the structured training exercise or prevention plan.'
    : 'LANGUAGE LOCK: respond ONLY in Spanish (es). Never output reasoning, thinking process, analysis steps, or text in any other language. All titles, steps, labels and explanations must be in Spanish. Eres un entrenador con licencia UEFA Pro y metodólogo experto en fútbol formativo y profesional. Comienza tu respuesta DIRECTAMENTE con el título del ejercicio usando markdown ## [Título del Ejercicio], seguido inmediatamente por los detalles estructurados.';

  const MODELS = ['qwen/qwen3.6-27b', 'openai/gpt-oss-120b', 'groq/compound', 'groq/compound-mini'];
  let lastErrorMsg = '';

  for (const model of MODELS) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      let groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 1500,
          temperature: 0.6,
        }),
      });

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json().catch(() => ({}));
        lastErrorMsg = errorData?.error?.message || `Error HTTP ${groqResponse.status} de Groq`;
        console.warn(`[ia-generate] Modelo ${model} falló:`, lastErrorMsg);
        continue;
      }

      let data = await groqResponse.json();
      let rawText = data?.choices?.[0]?.message?.content || '';

      let cleanResult = cleanAndValidateOutput(rawText, targetLang);

      // Reintento único si la salida resultó discordante con el idioma solicitado
      if (cleanResult.isDiscordant) {
        console.warn(`[ia-generate] Salida discordante con ${targetLang} detectada. Reintentando con directiva reforzada.`);
        const retryDirective = targetLang === 'en'
          ? 'LANGUAGE LOCK: respond ONLY in English (en). CRITICAL CORRECTION: Your previous output contained non-English or chain-of-thought text. Re-output the entire exercise strictly in ENGLISH starting directly with ## [Drill Title]. Zero reasoning.'
          : 'LANGUAGE LOCK: respond ONLY in Spanish (es). CORRECCIÓN CRÍTICA: Tu respuesta anterior contenía texto en inglés o razonamiento. Reescribe el ejercicio completo estrictamente en ESPAÑOL comenzando directamente con ## [Título]. Cero razonamiento.';

        messages.push({ role: 'assistant', content: cleanResult.text });
        messages.push({ role: 'user', content: retryDirective });

        const retryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: 1500,
            temperature: 0.4,
          }),
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryRaw = retryData?.choices?.[0]?.message?.content;
          if (retryRaw) {
            cleanResult = cleanAndValidateOutput(retryRaw, targetLang);
          }
        }
      }

      // Si tras el reintento persiste discordancia o está vacío, fallback seguro
      if (cleanResult.isDiscordant || !cleanResult.text || cleanResult.text.length < 20) {
        cleanResult.text = targetLang === 'en' ? FALLBACK_EN : FALLBACK_ES;
        cleanResult.isDiscordant = false;
      }

      if (cleanResult.text && cleanResult.text.length > 20) {
        return res.status(200).json({ result: cleanResult.text, locale: targetLang });
      }
    } catch (modelErr) {
      console.warn(`[ia-generate] Excepción con modelo ${model}:`, modelErr);
      lastErrorMsg = modelErr?.message || String(modelErr);
    }
  }

  return res.status(502).json({ error: lastErrorMsg || 'No se pudo conectar con los modelos de IA de Groq.' });
}
