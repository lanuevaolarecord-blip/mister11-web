---
name: language-protocol
description: >
  Protocolo estricto de idioma para apps con lenguaje seleccionable por el usuario.
  Usar al implementar, extender, auditar o corregir localización/i18n en CUALQUIER app:
  selector de idioma, diccionarios, textos mezclados, contenido generado por IA,
  exportaciones (PDF/CSV/ICS), rótulos de gráficas/canvas, push/emails/plantillas.
  Garantiza que el 100% del contenido renderizado coincida con el idioma elegido
  (es, en, fr, zh, …) sin fugas cruzadas. Disparadores: i18n, localization, idioma,
  language, traducción, translation, locale, "textos en inglés", mixed languages.
---

# Language Protocol — estricto, multi-locale, agnóstico de stack

## Objetivo
Cuando el usuario elige un idioma en Ajustes, TODO texto renderizado debe estar
en ese idioma: UI, salidas de IA/LLM, exportaciones, gráficas con texto,
notificaciones, emails, plantillas, fechas y números. Cero pantallas mixtas.
Funciona para cualquier número de locales y cualquier stack (React, Vue, RN,
Flutter, backend templating…).

## Alcance y única excepción
- DENTRO: todo texto generado por el sistema (labels, errores, vacíos,
  tooltips, badges, salidas de IA, cabeceras PDF/CSV/ICS, ejes/leyendas SVG o
  canvas, push/in-app, emails, consentimientos, intros de juegos, disclaimers).
- FUERA (se respeta tal cual): datos creados por el usuario (nombres, equipos,
  notas, títulos de sesión, chats), marcas, códigos técnicos (MC, DEF), logs.

## Reglas nucleares (innegociables)
R1 FUENTE ÚNICA: un registro de locales + un diccionario por locale; todo texto
   de UI vía t(key, vars). Un literal renderizable hardcodeado = error de build.
R2 LOCALE EN TODO: fechas/números/moneda/plurales vía Intl con el locale activo
   (DateTimeFormat, NumberFormat, PluralRules). Nunca toLocaleDateString() sin
   argumento de locale.
R3 AI LANGUAGE LOCK: toda llamada a LLM inyecta la directiva de idioma como
   PRIMERA línea del system prompt y post-valida la salida (ver Phase 3).
   Nunca se renderiza chain-of-thought crudo.
R4 EXPORTS SIGUEN LOCALE: PDF/CSV/ICS/emails/consentimientos se generan con el
   locale activo; notificaciones al RECEPTOR, con el locale del receptor.
R5 GRÁFICAS TRADUCIDAS: ejes, leyendas y tooltips vía t(); las imágenes nunca
   llevan texto embebido (se superpone traducido en render).
R6 CADENA DE FALLBACK: locale → locale base → key. Key faltante = warning visible
   en dev + fallo en CI; nunca un inglés silencioso en una UI no inglesa.
R7 PERSISTIR Y PROPAGAR: prefs.lang por usuario con fallback a dispositivo; el
   cambio re-renderiza todo en caliente sin recarga.
R8 RTL-READY: si un locale futuro es RTL (ar, he), aplicar dir globalmente.

## Workflow (en orden; adaptar al stack detectado)
### Phase 0 — Auditoría
1. Detectar stack y estado i18n actual (librería, diccionarios, switcher).
2. Listar locales actuales y puntos de render: grep de literales renderizables,
   call-sites de LLM, generadores de export, componentes canvas/SVG/charts,
   plantillas de notificación.
3. Entregar tabla: área → estado → archivos a tocar.

### Phase 1 — Arquitectura
1. Registro de locales: { code, label, intl, dir, name }.
2. LanguageProvider (context/store) que expone: lang, locale, t(), fmtDate(),
   fmtNumber(), fmtPlural(), setLang().
3. Diccionarios: un archivo por locale con el MISMO árbol de claves,
   namespaced por módulo; paridad de claves 100%.
4. Persistencia prefs.lang por usuario; fallback usuario → dispositivo → default.

### Phase 2 — Migración de UI
1. Sustituir cada literal por t(); parametrizar con vars (nunca concatenar).
2. Plurales vía fmtPlural; fechas vía fmtDate.
3. Activar el lint i18n duro (Phase 6) y corregir todas las violaciones.

### Phase 3 — AI LOCK (Groq/OpenAI/Gemini/cualquiera)
1. Inyectar como PRIMERA línea del system prompt:
   "LANGUAGE LOCK: respond ONLY in {LANGUAGE_NAME} ({locale}). Never output
   reasoning, thinking process, analysis steps, or any text in another
   language. All titles, steps, labels and explanations in {LANGUAGE_NAME}."
2. Post-procesar con validateLanguage(text, locale):
   a. Strip de chain-of-thought: regex "Here's a thinking process",
      "Reasoning:", "Thinking:", "Analyze User Input", "Step 1:", "1. Analyze".
   b. Detección de idioma por stopwords por locale; para zh/ja/ko detección de
      script (caracteres CJK vs latín).
   c. Si discordante: reintentar UNA vez con directiva reforzada; si persiste,
      fallback a plantilla segura en el locale activo + toast de reintento.
3. Guardar el locale usado junto al contenido generado (estabilidad de re-render).

### Phase 4 — Exportaciones y plantillas
1. PDF: cabeceras/columnas/pies desde diccionario; fuente con cobertura del
   locale (acentos es/fr; fuente CJK para zh).
2. CSV: cabeceras traducidas + BOM UTF-8. ICS: SUMMARY/DESCRIPTION traducidos.
3. Notificaciones/emails/consentimientos: locale del RECEPTOR.

### Phase 5 — Gráficas y medios
1. Todo rótulo de eje/leyenda/tooltip vía t().
2. Imágenes generadas: pedir arte sin texto y superponer caption traducido.

### Phase 6 — Vigilancia (bloqueante)
1. Lint i18n en build: falla ante literales renderizables fuera del diccionario
   y ante falta de paridad de claves entre locales.
2. Dev runtime "language lint": overlay que marca nodos DOM cuyo texto no está
   en el diccionario activo.
3. e2e qa-language: por CADA locale: cambiar → recorrer todos los módulos +
   1 generación IA + 1 exportación + 1 gráfica/juego → volcar texto visible →
   el detector debe dar 100% ese locale (excluyendo datos de usuario).
   FAIL bloquea merge y release.
4. Añadir lint + qa-language al pipeline de CI/PR.

### Phase 7 — Añadir un locale nuevo (fr, zh, …)
1. Entrada en registro + diccionario con paridad 100% (skeleton generado del
   locale base y luego traducido).
2. Verificar soporte Intl, cobertura de fuente, reglas de plural, expansión de
   texto (fr/de más largos; zh más corto pero más alto) y RTL si aplica.
3. Ejecutar qa-language para el locale nuevo.

## Plantillas de código (React; adaptar al stack)
```js
// locales/registry.js
export const LOCALES = {
  es: { label: 'Español', intl: 'es-ES', dir: 'ltr', name: 'Spanish' },
  en: { label: 'English', intl: 'en-US', dir: 'ltr', name: 'English' },
  fr: { label: 'Français', intl: 'fr-FR', dir: 'ltr', name: 'French' },
  zh: { label: '中文', intl: 'zh-CN', dir: 'ltr', name: 'Chinese (Simplified)' },
};

// LanguageProvider.jsx
const LangCtx = createContext(null);
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => loadPrefsLang() || deviceLang() || 'es');
  const t = useCallback((k, v) => interpolate(dict[lang]?.[k] ?? dict[BASE][k] ?? k, v), [lang]);
  const fmtDate = d => new Intl.DateTimeFormat(LOCALES[lang].intl, { dateStyle: 'medium' }).format(d);
  const fmtNumber = n => new Intl.NumberFormat(LOCALES[lang].intl).format(n);
  const fmtPlural = (n, k) => t(pluralKey(k, n, new Intl.PluralRules(lang).select(n)), { n });
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = LOCALES[lang].dir;
    savePrefsLang(lang);
  }, [lang]);
  return <LangCtx.Provider value={{ lang, locale: LOCALES[lang].intl, t, fmtDate, fmtNumber, fmtPlural, setLang }}>{children}</LangCtx.Provider>;
}

// aiLock.js
export const aiLanguageDirective = lang =>
  `LANGUAGE LOCK: respond ONLY in ${LOCALES[lang].name} (${lang}). Never output reasoning, ` +
  `thinking process, analysis steps, or text in any other language. All titles, steps, ` +
  `labels and explanations must be in ${LOCALES[lang].name}.`;

const STOPWORDS = {
  es: [' de ', ' la ', ' que ', ' el ', ' para ', ' con ', ' los '],
  en: [' the ', ' of ', ' and ', ' for ', ' with ', ' to '],
  fr: [' le ', ' la ', ' les ', ' des ', ' un ', ' une ', ' pour '],
  zh: null, // detección por script
};
const THINK_RE = /(here'?s a thinking process|reasoning:|thinking:|analyze user input|step \d+:|\d+\.\s*analyze)/i;
export function validateLanguage(text, lang) {
  const clean = text.replace(THINK_RE, '');
  const low = ' ' + clean.toLowerCase() + ' ';
  let ok;
  if (lang === 'zh') ok = /[\u4e00-\u9fff]/.test(clean);
  else {
    const hits = (STOPWORDS[lang] || []).filter(w => low.includes(w)).length;
    const others = Object.keys(STOPWORDS)
      .filter(k => k !== lang && STOPWORDS[k])
      .map(k => STOPWORDS[k].filter(w => low.includes(w)).length);
    ok = hits > 0 && hits >= Math.max(...others, 1);
  }
  return { ok: !!ok && !THINK_RE.test(text), clean };
}
```

## Definition of Done (checklist)
- [ ] Cambiar locale re-renderiza el 100% de la UI en caliente, sin recarga
- [ ] 0 literales hardcodeados (lint verde); paridad de claves 100% entre locales
- [ ] Salidas de IA 100% en el locale activo, sin fugas de razonamiento
- [ ] PDF/CSV/ICS/notificaciones en locale activo / del receptor
- [ ] Rótulos de gráficas y canvas traducidos
- [ ] Fechas/números/plurales vía Intl
- [ ] e2e qa-language en verde para TODOS los locales
- [ ] Datos de usuario intactos (sin traducir)

## Patrones de fallo típicos (revisar primero)
- "Loading… / Save / Cancel" en inglés dentro de una UI en español
- "Here's a thinking process…" de la IA renderizado en la UI
- Cabeceras de PDF/CSV hardcodeadas en inglés
- Ejes de canvas/SVG como literales
- Plantillas push/email en el idioma del emisor, no del receptor
- toLocaleDateString() sin locale → formato del SO
- Strings concatenados que rompen el orden de traducción
- Fallback mostrando valores en inglés en una UI no inglesa
