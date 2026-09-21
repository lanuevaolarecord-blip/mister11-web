# MÍSTER 11 — BACKLOG HORIZONTE 2 (H2)
## Benchmark The Tactics App — Alineación Estratégica Fase 2

> [!NOTE]
> Este documento registra las funcionalidades planificadas para el Horizonte 2 (H2).
> Los siguientes ítems están marcados como **PENDIENTES** y no se implementan en el sprint H1.
> Su ejecución futura debe respetar sin excepción la gobernanza visual de la marca (paleta exclusiva Tierra y Campo, cero emojis, cero skins de banderas nacionales y touch targets ≥48dp).

---

### 1. Panel Lines / Pitch View / Grass Paramétrico
- **Presets de Recorte Táctico**:
  - `full`: Campo completo reglamentario (105:68).
  - `half_attack`: Medio campo ofensivo.
  - `half_defense`: Medio campo defensivo.
  - `third_*`: Tercios tácticos (zona de inicio, creación y finalización).
  - `custom`: Encuadre libre con coordenadas persistentes.
- **Orientación Dinámica**: Alternancia bidireccional `landscape` y `portrait` con desacople completo entre la escena y el viewport.
- **Patrones de Césped Paramétricos**:
  - Franjas longitudinales, franjas transversales y damero (ajedrezado).
  - **Restricción de Gobernanza**: El selector de tonos y gradientes de césped estará restringido estrictamente a tonos derivados de **Verde Selva (#1B3A2D)**, **Verde Campo (#4CAF7D)** y tonos tierra. Prohibido cualquier tono azul, violeta o magenta.

---

### 2. Counter Design Completo (Fichas Tácticas Avanzadas)
- **Alineación y Estilo de Equipo**:
  - Selector de estilo propio vs. rival (Verde Campo #4CAF7D vs. Terracota/Gris cemento; Portero Oro #D4A843).
- **Etiquetas de Identidad Paramétricas**:
  - `Name`: Visualización jerárquica del nombre o apodo deportivo.
  - `Identity / Number`: Dorsal con tipografía deportiva de alto contraste.
  - `Bio / Highlight`: Métricas biométricas y roles específicos (ej. capitán, lanzador de faltas).
  - `Vertical`: Orientación de texto legible tanto en vista horizontal como vertical.

---

### 3. Catálogo Equipment Extendido (Materiales de Entrenamiento)
- **Nuevos Materiales de Pizarra**:
  - Mini porterías reglamentarias (metálicas y abatibles).
  - Siluetas / Barreras defensivas (Mannequins) a escala proporcional del campo.
  - Picas y postes verticales con paleta de señalización Tierra y Campo.
  - Vallas de agilidad y aros de coordinación.
- **Factor de Escala Proporcional**: Integración en el motor de Fabric.js con el factor de escala reglamentario de jugadores y materiales.

---

### 4. Squad Persistente (Load / Save As)
- **Gestor de Alineaciones en Pizarra**:
  - Capacidad de guardar alineaciones específicas de pizarra táctica independientemente de los partidos.
  - Función *Guardar como plantilla* (`Save As`) para reutilizar esquemas en ejercicios de entrenamiento.
  - Carga rápida (`Load Squad`) desde la base de datos de plantilla activa.
