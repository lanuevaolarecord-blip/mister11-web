# 👥 ARQUITECTURA DE SINCRONIZACIÓN MULTI-USUARIO Y CUERPO TÉCNICO — MÍSTER 11

**Versión:** 1.0.0  
**Fecha:** 16 de Agosto de 2026  
**Documento Técnico Oficial**

---

## 1. INTRODUCCIÓN Y OBJETIVO
El sistema multi-usuario de **Míster 11** permite que múltiples miembros de un cuerpo técnico (Primer Entrenador, Segundo Entrenador, Ayudante, Fisioterapeuta y Analista) trabajen simultáneamente sobre el mismo equipo en tiempo real, desde distintos dispositivos y cuentas, con control granular de roles y permisos.

---

## 2. MATRIZ DE ROLES Y PERMISOS DEL CUERPO TÉCNICO

| Rol | Identificador | Badge Visual | Permisos Clave |
|---|---|---|---|
| **Primer Entrenador** | `first_coach` | 👑 Primer Entrenador (`#D4A843`) | Control total del equipo: gestión de plantilla, invitar y eliminar miembros, cambiar roles, borrar equipo, acceso total a partidos, sesiones, pizarra y analíticas. |
| **Segundo Entrenador** | `second_coach` | 🥈 Segundo Entrenador (`#3B82F6`) | Edición de partidos, alineaciones, sesiones de entrenamiento, pizarra táctica, planificación mensual y asistencia. |
| **Ayudante / 3er Entrenador** | `assistant_coach` | 📋 Ayudante (`#10B981`) | Registro de eventos en vivo (Live Stats), control de asistencia y apoyo operativo en sesiones. |
| **Fisioterapeuta / Médico** | `physio` | 🩺 Fisioterapeuta (`#EF4444`) | Acceso y edición de fichas médicas, registro de lesiones, tests físicos/wellness y asistencia. |
| **Analista Táctico** | `analyst` | 📊 Analista (`#8B5CF6`) | Registro y visualización de Live Stats en tiempo real, análisis multi-partido, informes PDF y exportación. |

---

## 3. ARQUITECTURA DE DATOS EN FIRESTORE

### Estructura de Documentos y Subcolecciones
```
users/{ownerUid}/teams/{teamId}/
  ├── (doc): { nombre, categoria, temporada, ownerUid, ownerEmail, members: [...] }
  ├── members/{memberUid}               ← Subcolección con roles y datos de cada miembro
  ├── staff_invitations/{token}         ← Invitaciones activas del equipo
  ├── players/{playerId}                ← Plantilla de jugadores
  ├── matches/{matchId}/                ← Partidos
  │     └── events/{eventId}            ← Eventos Live Stats en tiempo real
  ├── sessions/{sessionId}              ← Sesiones de entrenamiento y ejercicios
  ├── planning/{mesoId}                 ← Mesociclos y microciclos
  ├── attendance/{dateStr}              ← Asistencia diaria
  ├── tests/{testId}                    ← Definiciones de tests
  └── evaluaciones/{evalId}             ← Resultados de evaluaciones

users/{memberUid}/shared_teams/{teamId}/  ← Puntero en cada miembro colaborador
  └── (doc): { id, teamId, teamPath, teamName, role, joinedAt }

staff_invitations/{token}/              ← Colección global para resolución rápida de enlaces
  └── (doc): { token, teamId, teamPath, teamName, role, invitedEmail, status, expiresAt }
```

---

## 4. MECANISMO DE SINCRONIZACIÓN EN TIEMPO REAL (`onSnapshot`)

### Prioridades y Tiempos de Respuesta:
1. **🔴 ALTA LATENCIA CRÍTICA (<1s):**
   - **Live Stats y Cronómetro de Partidos:** Los eventos se registran atómicamente y se propagan mediante suscripciones directas `subscribeToCollection` / `onSnapshot`.
   - **Pizarra Táctica:** Actualización de posicionamiento táctico en tiempo real.
2. **🟡 MEDIA LATENCIA (<2-3s):**
   - **Plantilla de Jugadores:** Sincronización instantánea de altas, bajas y estados físicos.
   - **Control de Asistencia:** Marcas de asistencia sincronizadas por sesión.
3. **🟢 BAJA LATENCIA (<5s):**
   - **Sesiones y Planificación Mensual:** Bloques de entrenamiento y mesociclos.

---

## 5. FLUJO DE INVITACIÓN E INCORPORACIÓN

1. **Generación de Enlace:**
   - El Primer Entrenador entra en **Mi Equipo** -> Pestaña **🛡️ Cuerpo Técnico**.
   - Pulsa **"Invitar Miembro"**, introduce el email y selecciona el rol (`second_coach`, `assistant_coach`, `physio`, `analyst`).
   - Se genera un enlace con token único: `https://www.mister11.app/join-team/{token}`.
2. **Aceptación e Incorporación (`JoinTeam.jsx`):**
   - El colaborador abre el enlace en su navegador o app móvil.
   - Si no ha iniciado sesión, se autentica con Google o Email.
   - Al pulsar **"Aceptar y Entrar al Equipo"**, el sistema:
     - Añade al usuario a `teamPath/members/{uid}` con su rol asignado.
     - Añade un puntero en `users/{uid}/shared_teams/{teamId}`.
     - Actualiza el estado de la invitación a `accepted`.
     - Establece el equipo como activo en la sesión del nuevo miembro.

---

## 6. SEGURIDAD Y REGLAS DE FIRESTORE (`firestore.rules`)
- **Aislamiento por Rol:** Las operaciones sensibles (eliminar equipo, cambiar roles) están restringidas exclusivamente al Primer Entrenador (`first_coach`).
- **Validación de Miembros:** La subcolección `members` y la colección global `staff_invitations` cuentan con validación de autenticación para garantizar la privacidad entre clubes y cuerpos técnicos.
