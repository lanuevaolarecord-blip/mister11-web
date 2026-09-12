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

const EXERCISE_PATTERNS_REGEX = /\b(ejercicio|comod[ií]n|comodines|series|repeticiones|\d+\s*x\s*\d+\s*m|###\s*ejercicios|objetivo:\s*\*\*\s*mantener|drill|neutral player|sets and reps)\b/i;

function cleanAndValidateOutput(rawText, targetLang, mode = 'drill') {
  if (!rawText || typeof rawText !== 'string') {
    return { text: '', isDiscordant: false, containsExercises: false };
  }

  // 1. Quitar etiquetas <think>...</think>
  let text = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim();

  // 2. Eliminar preámbulos y bloques de razonamiento (Chain of Thought) antes del contenido real
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim();

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
    } else if (/^\*\*(?:Objetivo|Objective|Ejercicio|Drill|Nombre|Plan|Ficha|Diagnóstico|Diagnostic)/i.test(trimmed)) {
      firstValidHeaderLine = i;
      break;
    }
  }

  if (firstValidHeaderLine > 0 && mode !== 'swot') {
    text = lines.slice(firstValidHeaderLine).join('\n').trim();
  }

  // 3. Eliminar líneas residuales de razonamiento / bullets de CoT si quedaran
  text = text
    .replace(/^[-*•]\s*(?:Role|Parameters|Drill Type|Sport|Age Group|Duration|Players|Level|Skill Focus|Analyze|Analysis|Input|Output|Step \d|Constraints|Key Elements|User Request|Language|Format)[^\n]*\n?/gim, '')
    .replace(/^\d+\.\s*(?:Analyze|Deconstruct|Design|Consider|Review|Think|Plan|Identify|Evaluate|User Input|Understand|Parse|Extract)[^\n]*\n?/gim, '')
    .replace(/(?:^|\n)(?:Here'?s (?:a |my )?(?:thinking|analysis|approach|plan)|Thinking Process:?|Reasoning:?|Analyze User Input:?|Analysis:?|My approach:?|Let me (?:analyze|design|create|think)|I(?:'ll| will) (?:create|design|analyze|generate))[^\n]*(?:\n(?![#*\-])[^\n]*)*/gi, '')
    .replace(/^(?:In this drill|Let's design|Okay, let's create|I will create|Sure, here|Certainly, here|Alright,)[^\n]*\n?/gim, '')
    .replace(/^(?:---+|\*\*\*+)\s*\n/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // En modo SWOT eliminar encabezados markdown # o ## para entregar un párrafo limpio
  if (mode === 'swot') {
    text = text.replace(/^#+\s+/gm, '').trim();
  }

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

  const containsExercises = mode === 'swot' && EXERCISE_PATTERNS_REGEX.test(text);

  return { text, isDiscordant, containsExercises, esCount, enCount };
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
  const { prompt, lang = 'es', mode = 'drill' } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "prompt" es obligatorio y debe ser una cadena de texto.' });
  }

  if (prompt.length > 8000) {
    return res.status(400).json({ error: 'El prompt supera el límite de 8.000 caracteres.' });
  }

  const targetLang = (lang === 'en' || lang === 'English (EN)') ? 'en' : 'es';

  // ── System Prompt con Regla de Oro de Idioma y Control Estricto según Modo ────
  let systemPrompt = '';
  if (mode === 'swot') {
    systemPrompt = targetLang === 'en'
      ? 'LANGUAGE LOCK: English (en). You are a technical writer. Summarize ONLY the provided SWOT items, in English, without adding exercises, drills, sets, reps, dimensions or advice not present in the items. Output exactly one or two concise, coherent technical summary paragraphs. Prohibit any exercise patterns.'
      : 'LANGUAGE LOCK: Español (es). Eres un redactor técnico. Resume SOLO los ítems DAFO proporcionados, en el idioma activo, sin añadir ejercicios, drills, series, repeticiones, dimensiones ni consejos no presentes en los ítems. Redacta uno o dos párrafos de síntesis estrictamente fiel a las métricas e ítems recibidos. Cero ejercicios.';
  } else {
    systemPrompt = targetLang === 'en'
      ? 'LANGUAGE LOCK: respond ONLY in English (en). Never output reasoning, thinking process, analysis steps, or text in any other language. All titles, steps, labels and explanations must be in English. You are a UEFA Pro licensed coach and elite youth football methodology expert. Start your output DIRECTLY with the exercise title using markdown ## [Drill Title], followed immediately by the structured training exercise or prevention plan.'
      : 'LANGUAGE LOCK: respond ONLY in Spanish (es). Never output reasoning, thinking process, analysis steps, or text in any other language. All titles, steps, labels and explanations must be in Spanish. Eres un entrenador con licencia UEFA Pro y metodólogo experto en fútbol formativo y profesional. Comienza tu respuesta DIRECTAMENTE con el título del ejercicio usando markdown ## [Título del Ejercicio], seguido inmediatamente por los detalles estructurados.';
  }

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
          temperature: mode === 'swot' ? 0.3 : 0.6,
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

      let cleanResult = cleanAndValidateOutput(rawText, targetLang, mode);

      // Reintento único si la salida resultó discordante con el idioma o contiene ejercicios en modo swot
      if (cleanResult.isDiscordant || cleanResult.containsExercises) {
        const reason = cleanResult.containsExercises ? 'ejercicios detectados en modo swot' : 'idioma discordante';
        console.warn(`[ia-generate] Salida inválida (${reason}). Reintentando con directiva reforzada.`);

        let retryDirective = '';
        if (mode === 'swot') {
          retryDirective = targetLang === 'en'
            ? 'LANGUAGE LOCK: respond ONLY in English (en). CRITICAL CORRECTION: Your previous output contained exercises or drills. Summarize ONLY the provided SWOT items in a single technical paragraph without drills, sets, reps or dimensions.'
            : 'LANGUAGE LOCK: respond ONLY in Spanish (es). CORRECCIÓN CRÍTICA: Tu respuesta anterior contenía ejercicios o series. Resume EXCLUSIVAMENTE los ítems DAFO proporcionados en un párrafo técnico sin inventar drills, series, repeticiones ni dimensiones.';
        } else {
          retryDirective = targetLang === 'en'
            ? 'LANGUAGE LOCK: respond ONLY in English (en). CRITICAL CORRECTION: Your previous output contained non-English or chain-of-thought text. Re-output the entire exercise strictly in ENGLISH starting directly with ## [Drill Title]. Zero reasoning.'
            : 'LANGUAGE LOCK: respond ONLY in Spanish (es). CORRECCIÓN CRÍTICA: Tu respuesta anterior contenía texto en inglés o razonamiento. Reescribe el ejercicio completo estrictamente en ESPAÑOL comenzando directamente con ## [Título]. Cero razonamiento.';
        }

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
            temperature: 0.2,
          }),
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryRaw = retryData?.choices?.[0]?.message?.content;
          if (retryRaw) {
            cleanResult = cleanAndValidateOutput(retryRaw, targetLang, mode);
          }
        }
      }

      // Si tras el reintento persiste discordancia o está vacío, fallback seguro según modo
      if (cleanResult.isDiscordant || cleanResult.containsExercises || !cleanResult.text || cleanResult.text.length < 20) {
        if (mode === 'swot') {
          cleanResult.text = targetLang === 'en'
            ? 'TACTICAL DIAGNOSIS: Based on the verified match metrics, the team showed key strengths alongside flagged vulnerabilities in central defending and finishing efficiency, as detailed in the SWOT matrix.'
            : 'DIAGNÓSTICO TÁCTICO: Con base en las métricas verificadas del partido, el equipo reflejó fortalezas claras junto a vulnerabilidades concretas en contención central y definición, según los ítems de la matriz DAFO.';
        } else {
          cleanResult.text = targetLang === 'en' ? FALLBACK_EN : FALLBACK_ES;
        }
        cleanResult.isDiscordant = false;
        cleanResult.containsExercises = false;
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
