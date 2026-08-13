# 📱 FICHA TÉCNICA Y DESCRIPCIÓN PARA GOOGLE PLAY STORE — MÍSTER 11 (v1.1.15)

**Aplicación:** Míster11 - Gestión Táctica  
**Paquete Android:** `com.mister11.app`  
**Versión:** v1.1.15 (versionCode: 34)  
**Categoría Primaria:** Deportes  
**Categoría Secundaria:** Herramientas / Productividad  
**Clasificación de Contenido IARC:** Apto para todos (PEGI 3 / USK 0 / IARC Everyone 3+)  
**Suscripciones In-App:** Sí (Plan Free vs Plan Pro - Stripe Integrated)  

---

## 📝 1. TEXTOS OFICIALES DE LA TIENDA

### 🔹 Nombre de la Aplicación (Máx. 30 caracteres)
`Míster11 - Gestión Táctica`

### 🔹 Descripción Corta (Máx. 80 caracteres)
`La oficina digital del entrenador: Pizarra 3D, Live Stats, IA e informes PDF.`

---

### 🔹 Descripción Larga (Ficha Principal Google Play)

**Míster 11** es la plataforma integral de rendimiento, metodología, inteligencia artificial y análisis táctico diseñada exclusivamente para entrenadores, cuerpos técnicos y clubes de fútbol (desde fútbol base y formativo hasta categorías semiprofesionales y profesionales).

Con una filosofía **Android-First** diseñada para uso en la banda con el pulgar, Míster 11 transforma tu teléfono móvil o tablet en la oficina digital completa del cuerpo técnico.

---

### 🌟 FUNCIONALIDADES CLAVE:

#### 1. ⚽ Pizarra Táctica 2D / 3D & Animación
- Diseña jugadas y sistemas de juego sobre un terreno táctico reglamentario en proporción 105:68.
- Utiliza herramientas vectoriales avanzadas: líneas de pase, desmarques, conos, picas y balones.
- Guarda fotogramas tácticos (frames) y reprodúcelos en animación fluida directamente a tus jugadores.

#### 2. 📊 Live Stats en Tiempo Real (Modo Banquillo)
- Registra en vivo **más de 16 métricas tácticas clave** (tiros a puerta, recuperaciones, pérdidas, duelos ganados, faltas, tarjetas, córners y goles) con un solo toque (0.8 segundos).
- Pantalla táctil de alto contraste visible bajo luz solar directa en estadios.
- Marcador dinámico en tiempo real y **gráficos Donut de eficiencias tácticas** (Duelos, Remates, Posesión).

#### 3. 📄 Generación de Informes PDF Corporativos (< 750 ms)
- Descarga al instante el informe post-partido profesional listo para compartir con el club, la directiva o los padres.
- Incluye captura en alta resolución del terreno táctico con las **fotografías reales de tus jugadores titulares**, tarjeta de **Convocados Suplentes** y gráficas Donut en alta resolución.

#### 4. 📈 Analítica Multi-Partido (Líneas de Tendencia & Radar 5 Ejes)
- Compara el rendimiento acumulado a lo largo del mesociclo.
- Visualiza la evolución temporal de remates/recuperaciones y analiza el **Radar Táctico Pentagonal de Rendimiento Global** (Fuerza, Resistencia, Velocidad, Técnica, Táctica).

#### 5. 🤖 Motor de IA Generadora de Tareas Metodológicas
- Asistente de inteligencia artificial que diseña ejercicios de entrenamiento completos a partir de prompts estructurados según tu modelo de juego.

#### 6. 📋 Gestión de Plantilla ("Mi Equipo") & Planificación
- Registra fichas de jugadores, dorsales, demarcaciones, control de asistencia y seguimiento antropométrico/lesiones.
- Planificador mesocíclico interactivo con cálculo automático de cargas semanales.

#### 7. 🌐 Internacionalización Dinámica (i18n ES / EN)
- Detección automática del idioma del sistema operativo (Español / Inglés) con traducción instantánea de la interfaz e informes PDF.

---

## 🔒 2. PRIVACIDAD, REGLAS FIRESTORE Y ASSETS DEL BUILD

- **Seguridad en Nube (Firestore Rules):** Aislamiento atómico estricto por `userId`, `teamId` y `matchId`. Ningún usuario externo puede acceder o modificar datos de otros equipos.
- **PWA & Offline Assets:** El Service Worker (`dist/sw.js`) indexa 102 entradas precheadas para funcionamiento garantizado en zonas con mala cobertura.
- **Artefacto de Despliegue Compilado:**  
  `android/app/build/outputs/bundle/release/app-release.aab` (38.52 MB / versionCode: 34 / versionName: 1.1.15 / Signed with Release Keystore).
