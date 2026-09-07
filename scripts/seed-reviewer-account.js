/**
 * scripts/seed-reviewer-account.js
 * ==============================================================================
 * MÍSTER11 — SCRIPT DE SEED: CUENTA DEMO PERMANENTE PARA REVISORES DE GOOGLE PLAY
 * ==============================================================================
 * Genera o actualiza la cuenta de revisor con datos realistas completos:
 * - Auth User: reviewer@mister11.app / Mister11Review2026! (Rol: coach)
 * - Equipo: Club Demo FC (Cadete, ID: club-demo-fc)
 * - 15 Jugadores completos (dorsales 1-15, estadísticas, cognitivo, asistencia)
 * - 16 Sesiones cerradas (4 semanas × 4 sesiones con asistencia sellada)
 * - 2 Partidos cerrados (1 victoria 3-1, 1 empate 2-2, actas oficiales, eventos, notas)
 * - 3 Comunicados en tablón de anuncios
 * - 2 Planes de entrenamiento (1 colectivo + 1 individual con progreso parcial)
 * - 3 Hilos de chat con historial de mensajes
 * - 6 Evaluaciones de tests (2 físicos, 2 técnicos, 2 psicosociales) + catálogo tests
 * - 3 Sesiones de juegos cognitivos con historial y radar
 * - 1 Reto semanal activo asignado al equipo
 * - Configuración de planificación estratégica
 *
 * Conexión resiliente:
 * 1. Usa serviceAccountKey.json si existe (local o variable de entorno).
 * 2. Fallback transparente a token de Firebase CLI (~/.config/configstore/firebase-tools.json).
 *
 * Idempotente: Si el usuario o el equipo ya existen, actualiza sin duplicar.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── CREDENCIALES OBJETIVO ───────────────────────────────────────────────────
const REVIEWER_EMAIL = 'reviewer@mister11.app';
const REVIEWER_PASSWORD = 'Mister11Review2026!';
const REVIEWER_NAME = 'Revisor Google Play';
const TEAM_ID = 'club-demo-fc';
const PROJECT_ID = 'mister11';

// ─── 1. RESOLVER CONEXIÓN FIREBASE ──────────────────────────────────────────
async function initFirebaseConnection() {
  const possibleKeyPaths = [
    path.resolve('serviceAccountKey.json'),
    path.resolve(__dirname, '../serviceAccountKey.json'),
    process.env.SERVICE_ACCOUNT_KEY,
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ].filter(Boolean);

  for (const keyPath of possibleKeyPaths) {
    if (fs.existsSync(keyPath)) {
      try {
        const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        console.log(`🔑 Usando serviceAccountKey: ${keyPath}`);
        const app = initializeApp({
          credential: cert(keyData),
          projectId: keyData.project_id || PROJECT_ID
        }, 'reviewer-seed-app');
        return {
          mode: 'admin',
          auth: getAuth(app),
          db: getFirestore(app)
        };
      } catch (err) {
        console.warn(`⚠️ Error leyendo ${keyPath}:`, err.message);
      }
    }
  }

  // Fallback: Firebase CLI OAuth token
  const homeDir = process.env.USERPROFILE || process.env.HOME || '';
  const cliConfigPath = path.join(homeDir, '.config', 'configstore', 'firebase-tools.json');

  if (fs.existsSync(cliConfigPath)) {
    try {
      const cliConfig = JSON.parse(fs.readFileSync(cliConfigPath, 'utf8'));
      const accessToken = cliConfig.tokens?.access_token;
      if (accessToken) {
        console.log('🔑 Usando credenciales activas de Firebase CLI (~/.config/configstore/firebase-tools.json)');
        const app = initializeApp({
          credential: {
            getAccessToken: () => Promise.resolve({ access_token: accessToken, expires_in: 3600 })
          },
          projectId: PROJECT_ID
        }, 'reviewer-seed-cli-app');

        const restDb = createFirestoreRestClient(PROJECT_ID, accessToken);
        return {
          mode: 'cli-rest',
          auth: getAuth(app),
          db: restDb
        };
      }
    } catch (err) {
      console.warn('⚠️ Error con credenciales CLI:', err.message);
    }
  }

  throw new Error(
    '❌ No se encontraron credenciales de Firebase.\n' +
    'Coloca "serviceAccountKey.json" en la raíz del proyecto o ejecuta "firebase login".'
  );
}

// ─── ADAPTADOR REST FIRESTORE PARA MODO CLI ──────────────────────────────────
function createFirestoreRestClient(projectId, token) {
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  function toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
      return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map(toFirestoreValue) } };
    }
    if (typeof val === 'object') {
      const fields = {};
      for (const [k, v] of Object.entries(val)) {
        fields[k] = toFirestoreValue(v);
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  return {
    async setDoc(docPath, data) {
      const url = `${baseUrl}/${docPath}`;
      const fields = {};
      for (const [k, v] of Object.entries(data)) {
        fields[k] = toFirestoreValue(v);
      }
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Firestore REST PATCH ${docPath} fallo (${res.status}): ${errText}`);
      }
      return res.json();
    },

    async deleteDoc(docPath) {
      const url = `${baseUrl}/${docPath}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 404) {
        const errText = await res.text();
        console.warn(`Aviso borrando ${docPath}:`, errText);
      }
    }
  };
}

// ─── WRAPPER UNIFICADO DE ESCRITURA ──────────────────────────────────────────
async function writeDocument(ctx, docPath, data) {
  if (ctx.mode === 'admin') {
    await ctx.db.doc(docPath).set(data, { merge: true });
  } else {
    await ctx.db.setDoc(docPath, data);
  }
}

// ─── 2. CREACIÓN O ACTUALIZACIÓN DE USUARIO AUTH ─────────────────────────────
async function ensureReviewerUser(auth) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(REVIEWER_EMAIL);
    console.log(`👤 Usuario encontrado (UID: ${userRecord.uid}). Actualizando credenciales...`);
    await auth.updateUser(userRecord.uid, {
      password: REVIEWER_PASSWORD,
      displayName: REVIEWER_NAME
    });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log(`👤 Creando nuevo usuario: ${REVIEWER_EMAIL}...`);
      userRecord = await auth.createUser({
        email: REVIEWER_EMAIL,
        password: REVIEWER_PASSWORD,
        displayName: REVIEWER_NAME
      });
    } else {
      throw err;
    }
  }
  return userRecord.uid;
}

// ─── 3. DATOS PRECARGADOS ────────────────────────────────────────────────────
function getPreloadedData(uid) {
  const now = new Date();
  const dateAgo = (days, hours = 18, mins = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hours, mins, 0, 0);
    return d;
  };

  const isoAgo = (days, hours = 18, mins = 0) => dateAgo(days, hours, mins).toISOString();
  const dateStrAgo = (days) => isoAgo(days).split('T')[0];

  // 15 Jugadores Cadetes
  const players = [
    { id: 'p01', name: 'Mateo Fernández', number: 1, position: 'POR', fechaNacimiento: '2009-03-14', foot: 'Derecho', height: '1.82', weight: '72', injuries: false, notaMedia: 7.8, attendancePct: 94 },
    { id: 'p02', name: 'Lucas Navarro', number: 2, position: 'DEF', fechaNacimiento: '2009-06-21', foot: 'Derecho', height: '1.74', weight: '66', injuries: false, notaMedia: 7.1, attendancePct: 90 },
    { id: 'p03', name: 'Hugo Serrano', number: 3, position: 'DEF', fechaNacimiento: '2009-11-05', foot: 'Izquierdo', height: '1.72', weight: '64', injuries: false, notaMedia: 6.9, attendancePct: 88 },
    { id: 'p04', name: 'Alejandro Ruiz', number: 4, position: 'DEF', fechaNacimiento: '2008-08-19', foot: 'Derecho', height: '1.80', weight: '71', injuries: false, notaMedia: 7.5, attendancePct: 92 },
    { id: 'p05', name: 'David Ramos', number: 5, position: 'DEF', fechaNacimiento: '2008-10-12', foot: 'Derecho', height: '1.83', weight: '74', injuries: false, notaMedia: 7.4, attendancePct: 85 },
    { id: 'p06', name: 'Adrián Morales', number: 6, position: 'MC', fechaNacimiento: '2009-01-30', foot: 'Derecho', height: '1.76', weight: '68', injuries: false, notaMedia: 7.9, attendancePct: 95 },
    { id: 'p07', name: 'Carlos Vega', number: 7, position: 'DEL', fechaNacimiento: '2009-04-18', foot: 'Derecho', height: '1.71', weight: '63', injuries: false, notaMedia: 8.1, attendancePct: 92 },
    { id: 'p08', name: 'Javier Castro', number: 8, position: 'MC', fechaNacimiento: '2009-07-25', foot: 'Derecho', height: '1.75', weight: '67', injuries: false, notaMedia: 7.2, attendancePct: 87 },
    { id: 'p09', name: 'Álvaro Molina', number: 9, position: 'DEL', fechaNacimiento: '2008-09-08', foot: 'Derecho', height: '1.81', weight: '73', injuries: false, notaMedia: 8.2, attendancePct: 96 },
    { id: 'p10', name: 'Marc García', number: 10, position: 'MC', fechaNacimiento: '2009-05-15', foot: 'Izquierdo', height: '1.73', weight: '65', injuries: false, notaMedia: 8.0, attendancePct: 96, isCaptain: true },
    { id: 'p11', name: 'Iker Benítez', number: 11, position: 'DEL', fechaNacimiento: '2009-12-03', foot: 'Izquierdo', height: '1.70', weight: '62', injuries: false, notaMedia: 7.6, attendancePct: 89 },
    { id: 'p12', name: 'Pablo Gil', number: 12, position: 'MC', fechaNacimiento: '2010-02-14', foot: 'Derecho', height: '1.72', weight: '64', injuries: false, notaMedia: 6.8, attendancePct: 82 },
    { id: 'p13', name: 'Daniel Ortiz', number: 13, position: 'POR', fechaNacimiento: '2010-04-20', foot: 'Derecho', height: '1.79', weight: '69', injuries: false, notaMedia: 6.7, attendancePct: 84 },
    { id: 'p14', name: 'Sergio Vidal', number: 14, position: 'DEF', fechaNacimiento: '2009-08-11', foot: 'Derecho', height: '1.77', weight: '68', injuries: false, notaMedia: 6.5, attendancePct: 80 },
    { id: 'p15', name: 'Gonzalo Peña', number: 15, position: 'DEL', fechaNacimiento: '2010-01-09', foot: 'Derecho', height: '1.73', weight: '65', injuries: false, notaMedia: 6.9, attendancePct: 83 }
  ];

  // 16 Sesiones distribuidas en las últimas 4 semanas
  const sessionTopics = [
    { title: 'Activación dinámica y velocidad gestual', cat: 'Física', intensity: 'Alta' },
    { title: 'Rondo de posesión 4v2 con transición', cat: 'Táctica', intensity: 'Media' },
    { title: 'Salida de balón bajo presión alta', cat: 'Táctica', intensity: 'Alta' },
    { title: 'Finalización rápida y centros al área', cat: 'Técnica', intensity: 'Media' },
    { title: 'Estructura defensiva en bloque medio', cat: 'Táctica', intensity: 'Media' },
    { title: 'Transición rápida ataque-defensa', cat: 'Táctica', intensity: 'Alta' },
    { title: 'Pases progresivos y juego del 3er hombre', cat: 'Técnica', intensity: 'Media' },
    { title: 'Velocidad de reacción en espacios reducidos', cat: 'Física', intensity: 'Alta' },
    { title: 'ABP: Saques de esquina y faltas laterales', cat: 'Táctica', intensity: 'Media' },
    { title: 'Juego posicional 7v7 + 3 comodines', cat: 'Táctica', intensity: 'Alta' },
    { title: 'Presión tras pérdida en campo rival', cat: 'Táctica', intensity: 'Alta' },
    { title: 'Circuitos técnicos de control y golpeo', cat: 'Técnica', intensity: 'Media' },
    { title: 'Fuerza preventiva y propiocepción', cat: 'Física', intensity: 'Baja' },
    { title: 'Ataque contra bloque bajo organizado', cat: 'Táctica', intensity: 'Media' },
    { title: 'Rondos de alta intensidad y 1-2 toques', cat: 'Técnica', intensity: 'Alta' },
    { title: 'Simulación táctica y balón parado previo', cat: 'Táctica', intensity: 'Media' }
  ];

  const sessions = sessionTopics.map((top, idx) => {
    const daysAgo = 28 - Math.floor((idx / 16) * 26);
    const sDate = dateStrAgo(daysAgo);
    const sid = `session_closed_${idx + 1}`;

    return {
      id: sid,
      title: top.title,
      nombre: top.title,
      date: sDate,
      time: '18:00',
      duration: 90,
      category: top.cat,
      intensity: top.intensity,
      location: 'Campo Municipal Las Rozas',
      objectives: `Objetivo principal: ${top.title.toLowerCase()}. Consolidar automatismos del equipo cadete.`,
      materials: 'Balones, conos, petos, mini-porterías',
      status: 'completed',
      cerrada: true,
      blocks: [
        { id: 1, name: 'Calentamiento y movilidad', type: 'Física', duration: 15, description: 'Activación articular y carreras con cambio de ritmo.' },
        { id: 2, name: 'Tarea principal I', type: top.cat, duration: 30, description: `Ejercicio progresivo enfocado en ${top.title.toLowerCase()}.` },
        { id: 3, name: 'Aplicación en partido reducido', type: 'Táctica', duration: 35, description: 'Condicionantes tácticos aplicados en espacio reducido.' },
        { id: 4, name: 'Vuelta a la calma', type: 'Física', duration: 10, description: 'Trote regenerativo y estiramientos estáticos.' }
      ],
      attendance: {
        source: 'coach',
        status: 'completed',
        sealed: true
      },
      createdAt: isoAgo(daysAgo + 1)
    };
  });

  // 2 Partidos cerrados
  const matches = [
    {
      id: 'match_cadete_01',
      rival: 'Rayo Majadahonda Cadete',
      type: 'Local',
      esLocal: true,
      date: dateStrAgo(14),
      fecha: dateStrAgo(14),
      time: '11:00',
      hora: '11:00',
      location: 'Campo Municipal Las Rozas',
      lugar: 'Campo Municipal Las Rozas',
      competition: 'Liga Preferente Cadete',
      duration: 90,
      status: 'Finalizado',
      estado: 'Finalizado',
      lineup: '4-3-3',
      formacion: '4-3-3',
      convocados: players.map(p => p.id),
      titulares: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11'],
      suplentes: ['p12', 'p13', 'p14', 'p15'],
      goalsFor: 3,
      goalsAgainst: 1,
      resultado: { local: 3, visitante: 1 },
      mvp: 'p10', // Marc García
      events: [
        { id: 'evt_1', minute: 18, type: 'gol_local', playerId: 'p10', playerName: 'Marc García', timestamp: isoAgo(14, 11, 18) },
        { id: 'evt_2', minute: 34, type: 'gol_rival', playerName: 'Rival', timestamp: isoAgo(14, 11, 34) },
        { id: 'evt_3', minute: 52, type: 'gol_local', playerId: 'p09', playerName: 'Álvaro Molina', timestamp: isoAgo(14, 11, 52) },
        { id: 'evt_4', minute: 60, type: 'sustitucion', subOutId: 'p05', subInId: 'p14', playerOutName: 'David Ramos', playerInName: 'Sergio Vidal', timestamp: isoAgo(14, 12, 0) },
        { id: 'evt_5', minute: 68, type: 'amarilla', playerId: 'p06', playerName: 'Adrián Morales', timestamp: isoAgo(14, 12, 8) },
        { id: 'evt_6', minute: 73, type: 'sustitucion', subOutId: 'p07', subInId: 'p15', playerOutName: 'Carlos Vega', playerInName: 'Gonzalo Peña', timestamp: isoAgo(14, 12, 13) },
        { id: 'evt_7', minute: 82, type: 'gol_local', playerId: 'p15', playerName: 'Gonzalo Peña', timestamp: isoAgo(14, 12, 22) }
      ],
      minutosJugados: {
        p01: 90, p02: 90, p03: 90, p04: 90, p05: 60, p06: 90,
        p07: 73, p08: 90, p09: 90, p10: 90, p11: 90, p12: 0,
        p13: 0, p14: 30, p15: 17
      },
      valoraciones: {
        p01: 7.8, p02: 7.0, p03: 6.9, p04: 7.6, p05: 7.2, p06: 7.5,
        p07: 8.0, p08: 7.1, p09: 8.3, p10: 8.8, p11: 7.4, p14: 7.0, p15: 7.9
      },
      actaOficial: {
        closed: true,
        closedWithWarnings: false,
        closedAt: isoAgo(14, 13, 0),
        closedByUid: uid,
        closedByName: REVIEWER_NAME
      },
      notes: 'Gran partido del equipo, excelente circulación interior y verticalidad de los extremos.',
      createdAt: isoAgo(14, 9, 0)
    },
    {
      id: 'match_cadete_02',
      rival: 'Atlético Villalba Cadete',
      type: 'Visitante',
      esLocal: false,
      date: dateStrAgo(7),
      fecha: dateStrAgo(7),
      time: '12:30',
      hora: '12:30',
      location: 'Polideportivo Municipal Villalba',
      lugar: 'Polideportivo Municipal Villalba',
      competition: 'Liga Preferente Cadete',
      duration: 90,
      status: 'Finalizado',
      estado: 'Finalizado',
      lineup: '4-3-3',
      formacion: '4-3-3',
      convocados: players.map(p => p.id),
      titulares: ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11'],
      suplentes: ['p12', 'p13', 'p14', 'p15'],
      goalsFor: 2,
      goalsAgainst: 2,
      resultado: { local: 2, visitante: 2 },
      mvp: 'p09', // Álvaro Molina
      events: [
        { id: 'evt_1', minute: 14, type: 'gol_rival', playerName: 'Rival', timestamp: isoAgo(7, 12, 44) },
        { id: 'evt_2', minute: 31, type: 'gol_local', playerId: 'p09', playerName: 'Álvaro Molina', timestamp: isoAgo(7, 13, 1) },
        { id: 'evt_3', minute: 58, type: 'sustitucion', subOutId: 'p08', subInId: 'p12', playerOutName: 'Javier Castro', playerInName: 'Pablo Gil', timestamp: isoAgo(7, 13, 28) },
        { id: 'evt_4', minute: 67, type: 'gol_rival', playerName: 'Rival', timestamp: isoAgo(7, 13, 37) },
        { id: 'evt_5', minute: 76, type: 'sustitucion', subOutId: 'p11', subInId: 'p15', playerOutName: 'Iker Benítez', playerInName: 'Gonzalo Peña', timestamp: isoAgo(7, 13, 46) },
        { id: 'evt_6', minute: 86, type: 'gol_local', playerId: 'p10', playerName: 'Marc García', timestamp: isoAgo(7, 13, 56) }
      ],
      minutosJugados: {
        p01: 90, p02: 90, p03: 90, p04: 90, p05: 90, p06: 90,
        p07: 90, p08: 58, p09: 90, p10: 90, p11: 76, p12: 32,
        p13: 0, p14: 0, p15: 14
      },
      valoraciones: {
        p01: 7.2, p02: 7.1, p03: 7.0, p04: 7.4, p05: 7.3, p06: 7.8,
        p07: 7.5, p08: 6.8, p09: 8.4, p10: 8.2, p11: 7.0, p12: 7.1, p15: 7.2
      },
      actaOficial: {
        closed: true,
        closedWithWarnings: false,
        closedAt: isoAgo(7, 14, 30),
        closedByUid: uid,
        closedByName: REVIEWER_NAME
      },
      notes: 'Partido muy disputado bajo lluvia. Reacción notable en los últimos minutos para empatar.',
      createdAt: isoAgo(7, 10, 0)
    }
  ];

  // 3 Anuncios
  const announcements = [
    {
      id: 'ann_01',
      title: '📢 Convocatoria y logística para el próximo partido de Liga',
      message: 'Recordamos a toda la plantilla que el autobús saldrá a las 09:30 desde la sede del club. Es obligatorio llevar las dos equipaciones oficiales y el DNI original.',
      authorName: REVIEWER_NAME,
      authorUid: uid,
      priority: 'high',
      createdAt: isoAgo(2, 10, 0)
    },
    {
      id: 'ann_02',
      title: '⚽ Gran victoria vs Rayo Majadahonda (3-1)',
      message: 'Enhorabuena a todo el equipo por la intensidad y el compromiso táctico demostrado el fin de semana. El martes analizaremos los vídeos en la sala de prensa antes de salir al campo.',
      authorName: REVIEWER_NAME,
      authorUid: uid,
      priority: 'normal',
      createdAt: isoAgo(13, 12, 0)
    },
    {
      id: 'ann_03',
      title: '📋 Bienvenida a la temporada y normativa interna',
      message: 'Bienvenidos al nuevo ciclo competitivo de Cadetes. Recordad que la puntualidad, el descanso y la nutrición son fundamentales para rendir al máximo nivel.',
      authorName: REVIEWER_NAME,
      authorUid: uid,
      priority: 'low',
      createdAt: isoAgo(27, 9, 0)
    }
  ];

  // 2 Planes de entrenamiento (1 colectivo, 1 individual)
  const playerPlans = [
    {
      id: 'plan_team_01',
      title: 'Plan Colectivo: Resistencia Aeróbica y Toma de Decisión',
      description: 'Bloque de trabajo complementario en 4 semanas para sostener el ritmo en los últimos 20 minutos de partido.',
      category: 'Físico',
      assignedToAll: true,
      active: true,
      exercises: [
        {
          name: 'Sprint intermitente 10x30m',
          series: 3,
          reps: 10,
          rest: '45s',
          completedDates: [dateStrAgo(20), dateStrAgo(13), dateStrAgo(6)]
        },
        {
          name: 'Core y estabilidad lumbar en fitball',
          series: 4,
          reps: 1,
          rest: '30s',
          completedDates: [dateStrAgo(21), dateStrAgo(14)]
        }
      ],
      createdAt: isoAgo(25, 10, 0)
    },
    {
      id: 'plan_ind_marc_02',
      title: 'Plan Individual: Definición con Pierna Débil',
      description: 'Perfeccionamiento del golpeo con pierna derecha tras control orientado en el balcón del área.',
      category: 'Técnico',
      playerId: 'p10', // Marc García
      assignedToAll: false,
      active: true,
      exercises: [
        {
          name: 'Disparo cruzado pierna derecha tras recorte',
          series: 4,
          reps: 12,
          rest: '60s',
          completedDates: [dateStrAgo(16), dateStrAgo(9), dateStrAgo(3)]
        }
      ],
      createdAt: isoAgo(20, 11, 0)
    }
  ];

  // 3 Conversaciones de chat
  const chatThreads = [
    {
      playerId: 'p10', // Marc García
      playerName: 'Marc García',
      lastMessage: 'Perfecto míster, mañana llego 15 minutos antes para repasar los vídeos de estrategia.',
      lastSender: 'Marc García',
      lastSenderUid: 'p10',
      lastSenderRole: 'player',
      unreadByCoach: false,
      unreadByPlayer: false,
      updatedAt: isoAgo(1, 20, 15),
      messages: [
        { id: 'm1', senderUid: uid, senderRole: 'coach', senderName: REVIEWER_NAME, text: 'Hola Marc, partidazo el sábado. Tu liderazgo en el medio campo fue clave.', createdAt: isoAgo(2, 18, 30) },
        { id: 'm2', senderUid: 'p10', senderRole: 'player', senderName: 'Marc García', text: '¡Muchas gracias míster! El equipo estuvo muy solidario en la presión.', createdAt: isoAgo(2, 19, 10) },
        { id: 'm3', senderUid: uid, senderRole: 'coach', senderName: REVIEWER_NAME, text: 'Quiero que mañana revisemos las jugadas a balón parado ofensivas antes de saltar al campo.', createdAt: isoAgo(1, 19, 45) },
        { id: 'm4', senderUid: 'p10', senderRole: 'player', senderName: 'Marc García', text: 'Entendido. ¿A qué hora nos vemos en el vestuario?', createdAt: isoAgo(1, 20, 0) },
        { id: 'm5', senderUid: 'p10', senderRole: 'player', senderName: 'Marc García', text: 'Perfecto míster, mañana llego 15 minutos antes para repasar los vídeos de estrategia.', createdAt: isoAgo(1, 20, 15) }
      ]
    },
    {
      playerId: 'p01', // Mateo Fernández
      playerName: 'Mateo Fernández',
      lastMessage: 'Trabajo específico de blocaje aéreo completado con éxito, buenas sensaciones.',
      lastSender: 'Mateo Fernández',
      lastSenderUid: 'p01',
      lastSenderRole: 'player',
      unreadByCoach: false,
      unreadByPlayer: false,
      updatedAt: isoAgo(5, 17, 40),
      messages: [
        { id: 'm1', senderUid: uid, senderRole: 'coach', senderName: REVIEWER_NAME, text: 'Mateo, enfócate esta semana en la comunicación con los centrales en centros laterales.', createdAt: isoAgo(6, 16, 0) },
        { id: 'm2', senderUid: 'p01', senderRole: 'player', senderName: 'Mateo Fernández', text: 'Sí míster, lo he hablado con Alejandro y David para coordinar las salidas.', createdAt: isoAgo(6, 17, 10) },
        { id: 'm3', senderUid: 'p01', senderRole: 'player', senderName: 'Mateo Fernández', text: 'Trabajo específico de blocaje aéreo completado con éxito, buenas sensaciones.', createdAt: isoAgo(5, 17, 40) }
      ]
    },
    {
      playerId: 'p07', // Carlos Vega
      playerName: 'Carlos Vega',
      lastMessage: 'Sin ninguna molestia míster, 100% disponible para el sábado.',
      lastSender: 'Carlos Vega',
      lastSenderUid: 'p07',
      lastSenderRole: 'player',
      unreadByCoach: false,
      unreadByPlayer: false,
      updatedAt: isoAgo(10, 14, 20),
      messages: [
        { id: 'm1', senderUid: uid, senderRole: 'coach', senderName: REVIEWER_NAME, text: 'Carlos, ¿cómo notas el isquio después de la sesión de ayer?', createdAt: isoAgo(10, 12, 0) },
        { id: 'm2', senderUid: 'p07', senderRole: 'player', senderName: 'Carlos Vega', text: 'Sin ninguna molestia míster, 100% disponible para el sábado.', createdAt: isoAgo(10, 14, 20) }
      ]
    }
  ];

  // 6 Evaluaciones de tests
  const evaluations = [
    { id: 'ev_01', testId: 't4', testName: 'Sprint 30m', category: 'Velocidad', type: 'fisico', jugadorId: 'p10', playerId: 'p10', val: 4.12, valor: 4.12, date: dateStrAgo(10), timestamp: isoAgo(10) },
    { id: 'ev_02', testId: 't6', testName: 'Salto CMJ', category: 'Fuerza', type: 'fisico', jugadorId: 'p09', playerId: 'p09', val: 42.5, valor: 42.5, date: dateStrAgo(10), timestamp: isoAgo(10) },
    { id: 'ev_03', testId: 't7', testName: 'Conducción conos', category: 'Técnica', type: 'fisico', jugadorId: 'p07', playerId: 'p07', val: 8.4, valor: 8.4, date: dateStrAgo(12), timestamp: isoAgo(12) },
    { id: 'ev_04', testId: 't8', testName: 'Pase a portería', category: 'Técnica', type: 'fisico', jugadorId: 'p10', playerId: 'p10', val: 9, valor: 9, date: dateStrAgo(12), timestamp: isoAgo(12) },
    { id: 'ev_05', testId: 'psi1', testName: 'ACSI-28 Afrontamiento', category: 'Afrontamiento', type: 'psicosocial', jugadorId: 'p01', playerId: 'p01', val: 26, valor: 26, date: dateStrAgo(18), timestamp: isoAgo(18) },
    { id: 'ev_06', testId: 'psi2', testName: 'MTQ-10 Fortaleza Mental', category: 'Fortaleza Mental', type: 'psicosocial', jugadorId: 'p06', playerId: 'p06', val: 18, valor: 18, date: dateStrAgo(18), timestamp: isoAgo(18) }
  ];

  // Sesiones de juegos cognitivos para jugadores
  const cognitiveSessions = [
    { playerId: 'p10', gameId: 'g1', reactionMs: 310, accuracy: 95, score: 520, xp: 35, startedAt: isoAgo(3, 19, 0), endedAt: isoAgo(3, 19, 5) },
    { playerId: 'p10', gameId: 'g3', reactionMs: 410, accuracy: 89, score: 440, xp: 25, startedAt: isoAgo(5, 18, 30), endedAt: isoAgo(5, 18, 35) },
    { playerId: 'p09', gameId: 'g2', reactionMs: 295, accuracy: 96, score: 530, xp: 35, startedAt: isoAgo(2, 20, 0), endedAt: isoAgo(2, 20, 5) }
  ];

  // Reto semanal asignado
  const gameAssignment = {
    id: 'assign_demo_01',
    title: '⚡ Reto Semanal: Concentración y Decisión Rápida',
    target: 'team',
    gameIds: ['g1', 'g6'],
    assignedBy: uid,
    assignedByName: REVIEWER_NAME,
    status: 'active',
    createdAt: isoAgo(3, 10, 0),
    expiresAt: isoAgo(-4, 23, 59)
  };

  return {
    players,
    sessions,
    matches,
    announcements,
    playerPlans,
    chatThreads,
    evaluaciones: evaluations,
    cognitiveSessions,
    gameAssignment
  };
}

// ─── 4. EJECUCIÓN PRINCIPAL ──────────────────────────────────────────────────
async function runSeed() {
  console.log('================================================================');
  console.log('🚀 MÍSTER11 — SEED DE CUENTA DEMO PARA REVISORES DE GOOGLE PLAY');
  console.log('================================================================');

  const ctx = await initFirebaseConnection();
  const uid = await ensureReviewerUser(ctx.auth);
  console.log(`✅ Usuario verificado: ${REVIEWER_EMAIL} (UID: ${uid})`);

  const teamPath = `users/${uid}/teams/${TEAM_ID}`;
  console.log(`📦 Sembrando datos en: ${teamPath}...`);

  // A) Documento de usuario
  await writeDocument(ctx, `users/${uid}`, {
    email: REVIEWER_EMAIL,
    displayName: REVIEWER_NAME,
    role: 'coach',
    activeTeamId: TEAM_ID,
    currentTeamId: TEAM_ID,
    activeMode: 'coach',
    isReviewer: true,
    updatedAt: new Date().toISOString()
  });

  await writeDocument(ctx, `users/${uid}/prefs/lastMode`, {
    mode: 'coach',
    updatedAt: new Date().toISOString()
  });

  // B) Metadatos del Equipo
  await writeDocument(ctx, teamPath, {
    id: TEAM_ID,
    name: 'Club Demo FC',
    nombre: 'Club Demo FC',
    category: 'Cadete',
    categoria: 'Cadete',
    coachId: uid,
    entrenador: REVIEWER_NAME,
    temporada: '2025-26',
    color: '#0066FF',
    colorLocal: '#0066FF',
    colorVisitante: '#10B981',
    escudo: '',
    leaderboardAnonymous: false,
    settings: {
      cognitive: {
        radarWeight: 0.2
      }
    },
    updatedAt: new Date().toISOString()
  });

  // Configuración de planificación
  await writeDocument(ctx, `${teamPath}/planificacion/config`, {
    category: 'Cadete',
    season: '2025/2026',
    trainer: REVIEWER_NAME,
    seasonStart: '2025-09-01',
    seasonEnd: '2026-06-30',
    updatedAt: new Date().toISOString()
  });

  const data = getPreloadedData(uid);

  // C) 15 Jugadores
  console.log(`👥 Guardando 15 jugadores cadetes...`);
  for (const player of data.players) {
    const playerDocPath = `${teamPath}/players/${player.id}`;
    await writeDocument(ctx, playerDocPath, {
      ...player,
      birthDate: player.fechaNacimiento,
      dorsal: player.number,
      posicion: player.position,
      requesterUid: `demo_${player.id}`,
      cognitive: {
        totalXp: 150 + (player.number * 8),
        cognitiveScore: Math.min(95, 70 + Math.round(player.notaMedia * 2.5)),
        levels: { g1: 3, g2: 2, g3: 3, g4: 2, g5: 1, g6: 2 },
        best: { g1: 310, g2: 94, g3: 460 },
        weekly: { points: 60, improvement: 10 }
      },
      updatedAt: new Date().toISOString()
    });
  }

  // D) 16 Sesiones + Asistencias
  console.log(`📅 Guardando 16 sesiones cerradas y asistencia sellada...`);
  for (const session of data.sessions) {
    await writeDocument(ctx, `${teamPath}/sessions/${session.id}`, session);

    // Registro en attendance/{sessionId}
    const records = {};
    data.players.forEach(p => {
      records[p.id] = { status: 'presente', lateMin: 0 };
    });
    // Simular un retraso justificado para realismo
    if (records['p05']) records['p05'] = { status: 'retraso', lateMin: 10 };

    await writeDocument(ctx, `${teamPath}/attendance/${session.id}`, {
      eventId: session.id,
      eventType: 'session',
      source: 'coach',
      date: session.date,
      records,
      presentes: data.players.map(p => p.id),
      updatedAt: new Date().toISOString()
    });
  }

  // E) 2 Partidos cerrados con acta oficial
  console.log(`⚽ Guardando 2 partidos con actas oficiales y eventos...`);
  for (const match of data.matches) {
    await writeDocument(ctx, `${teamPath}/matches/${match.id}`, match);
  }

  // F) 3 Anuncios
  console.log(`📢 Guardando 3 comunicados de vestuario...`);
  for (const ann of data.announcements) {
    await writeDocument(ctx, `${teamPath}/announcements/${ann.id}`, ann);
  }

  // G) 2 Planes de entrenamiento
  console.log(`📋 Guardando 2 planes de entrenamiento...`);
  for (const plan of data.playerPlans) {
    await writeDocument(ctx, `${teamPath}/playerPlans/${plan.id}`, plan);
  }

  // H) 3 Conversaciones de chat con mensajes
  console.log(`💬 Guardando 3 hilos de chat y mensajes...`);
  for (const thread of data.chatThreads) {
    const threadPath = `${teamPath}/threads/${thread.playerId}`;
    await writeDocument(ctx, threadPath, {
      playerId: thread.playerId,
      playerName: thread.playerName,
      lastMessage: thread.lastMessage,
      lastSender: thread.lastSender,
      lastSenderUid: thread.lastSenderUid,
      lastSenderRole: thread.lastSenderRole,
      unreadByCoach: thread.unreadByCoach,
      unreadByPlayer: thread.unreadByPlayer,
      updatedAt: thread.updatedAt
    });

    for (const msg of thread.messages) {
      await writeDocument(ctx, `${threadPath}/messages/${msg.id}`, msg);
    }
  }

  // I) 6 Evaluaciones de tests
  console.log(`📊 Guardando 6 evaluaciones de tests...`);
  for (const ev of data.evaluaciones) {
    await writeDocument(ctx, `${teamPath}/evaluaciones/${ev.id}`, ev);
    await writeDocument(ctx, `${teamPath}/test_results/${ev.id}`, ev);
  }

  // J) Sesiones cognitivas de muestra
  console.log(`🧠 Guardando historial de juegos cognitivos...`);
  for (let i = 0; i < data.cognitiveSessions.length; i++) {
    const cs = data.cognitiveSessions[i];
    await writeDocument(ctx, `${teamPath}/players/${cs.playerId}/cognitive/cog_${i + 1}`, cs);
  }

  // K) Asignación de reto
  console.log(`🎯 Guardando asignación de reto cognitivo...`);
  await writeDocument(ctx, `${teamPath}/gameAssignments/${data.gameAssignment.id}`, data.gameAssignment);

  console.log('\n================================================================');
  console.log('🎉 ¡SEED COMPLETADO CON ÉXITO!');
  console.log('================================================================');
  console.log('Credenciales de acceso para Google Play Console:');
  console.log(`  - Usuario:     ${REVIEWER_EMAIL}`);
  console.log(`  - Contraseña:  ${REVIEWER_PASSWORD}`);
  console.log(`  - Rol:         Entrenador (coach)`);
  console.log(`  - Equipo:      Club Demo FC (ID: ${TEAM_ID})`);
  console.log('================================================================');
}

runSeed().catch(err => {
  console.error('\n❌ Error ejecutando seed:', err);
  process.exit(1);
});
