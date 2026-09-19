# CHECKLIST DE IMPLEMENTACIÓN Y CALIDAD (OBLIGATORIO)

Este protocolo es de estricto cumplimiento para Antigravity y cualquier desarrollador que trabaje en el código de **Míster11**.

---

## 1. Antes de Codificar (Fase de Consulta y Prevención)
- [ ] Ejecutar en consola:
  ```bash
  npm run before-implement
  ```
- [ ] Consultar [LECCIONES_APRENDIDAS.md](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/docs/LECCIONES_APRENDIDAS.md) para identificar problemas resueltos en módulos similares.
- [ ] Revisar si aplica alguno de los patrones de solución en [solutionPatterns.js](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/solutionPatterns.js).
- [ ] Mapear los anti-patrones a evitar detallados en [errorPatterns.js](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/errorPatterns.js).

---

## 2. Durante la Implementación (Fase de Construcción)
- [ ] **Iconografía Vectorial:** Utilizar componentes de `lucide-react`. Está **prohibido** el uso de emojis en botones, pestañas o chips.
- [ ] **Paleta Oficial "Tierra y Campo":**
  - Verde Selva Institucional: `#1B3A2D`
  - Verde Campo (Éxito / Acento): `#4CAF7D`
  - Oro Míster11 (Destacados / PRO): `#D4A843`
  - Arena (Fondo Claro): `#F5F0E8`
  - Prohibido el uso de azules genéricos (`#3B82F6`, `#2563EB`, etc.).
- [ ] **Internacionalización (i18n):** Ningún texto visible en pantalla debe estar hardcodeado. Extraer todas las cadenas a `translations.js` y consumirlas mediante `t('clave')`.
- [ ] **Operaciones Asíncronas:** Todo bloque asíncrono con estado de carga debe estructurarse con `try { ... } catch (err) { ... } finally { setIsLoading(false); }`.
- [ ] **Búsquedas Reactivas:** Toda búsqueda conectada a Firestore debe incorporar un debounce mínimo de `300 ms`.
- [ ] **Medios Opcionales:** Todo componente de imagen (`<img>`) debe incluir `onError` y fallback visual a avatar circular con inicial.
- [ ] **Android First & Accesibilidad:**
  - Touch targets mínimos de `48x48 dp` para todo botón o elemento interactivo.
  - Relación de contraste WCAG AA/AAA verificada tanto en **Modo Claro** como en **Modo Oscuro**.
- [ ] **Respeto a Staff Heredado:** No alterar ni desproteger la lógica de permisos contextuales de equipo (`useEffectivePlan`).

---

## 3. Después de Implementar (Fase de Verificación y Cierre)
- [ ] **Auditoría de i18n:**
  ```bash
  node scripts/ci-i18n-gate.mjs
  ```
  *(Debe reportar 0 offenders).*
- [ ] **Auditoría de Paleta Institucional:**
  ```bash
  node scripts/check-chart-palette.mjs
  ```
  *(Debe reportar 0 violaciones de paleta).*
- [ ] **Auditoría de Aprendizaje y Anti-patrones:**
  ```bash
  npm run learn-from-errors
  ```
- [ ] **Compilación de Producción:**
  ```bash
  npm run build
  ```
  *(Debe compilar en Vite sin advertencias ni errores).*
- [ ] **Pruebas en Móvil Real / Emulador Android:** Verificar visualmente la disposición y touch targets.
- [ ] **Actualización del Conocimiento:** Si se descubrió un nuevo comportamiento o problema inesperado durante el desarrollo, registrarlo de inmediato en [LECCIONES_APRENDIDAS.md](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/docs/LECCIONES_APRENDIDAS.md).
