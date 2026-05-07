/**
 * seedData.js
 * Inserta datos de muestra realistas en Firestore para un equipo recién creado.
 * Solo se ejecuta si las colecciones están vacías.
 * Ruta: users/{uid}/teams/{teamId}/{players|sessions|matches}
 */

import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * @param {string} teamId - ID del equipo recién creado
 * @param {string} userId - UID del usuario autenticado
 */
export const seedInitialData = async (teamId, userId) => {
  if (!teamId || !userId) return;

  const teamPath = `users/${userId}/teams/${teamId}`;

  try {
    // ─── 1. JUGADORES ──────────────────────────────────────────────────────────
    const playersRef = collection(db, teamPath, 'players');
    const playersSnap = await getDocs(playersRef);

    const playerIds = [];

    if (playersSnap.empty) {
      const samplePlayers = [
        {
          name: 'Marc García',
          number: 7,
          position: 'DEL',
          fechaNacimiento: '2010-05-15',
          foot: 'Derecho',
          height: '',
          weight: '',
          injuries: false,
          injuryType: '',
          createdAt: serverTimestamp()
        },
        {
          name: 'Carlos Ruiz',
          number: 5,
          position: 'DEF',
          fechaNacimiento: '2010-03-22',
          foot: 'Derecho',
          height: '',
          weight: '',
          injuries: false,
          injuryType: '',
          createdAt: serverTimestamp()
        },
        {
          name: 'Álex Gómez',
          number: 10,
          position: 'MC',
          fechaNacimiento: '2010-07-10',
          foot: 'Izquierdo',
          height: '',
          weight: '',
          injuries: false,
          injuryType: '',
          createdAt: serverTimestamp()
        }
      ];

      for (const player of samplePlayers) {
        const ref = await addDoc(playersRef, player);
        playerIds.push(ref.id);
      }
    }

    // ─── 2. SESIONES ───────────────────────────────────────────────────────────
    const sessionsRef = collection(db, teamPath, 'sessions');
    const sessionsSnap = await getDocs(sessionsRef);

    if (sessionsSnap.empty) {
      const today = new Date();

      const dateIn = (days) => {
        const d = new Date(today);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
      };

      const sampleSessions = [
        {
          // Campos en inglés: requeridos por Sesiones.jsx
          title:     'Técnica de pase y control',
          date:      dateIn(2),
          time:      '17:00',
          duration:  90,
          category:  'Técnica',
          intensity: 'Media',
          objectives: 'Mejorar la precisión del primer toque y la velocidad del pase corto.',
          materials: 'Balones, conos',
          players:   [],
          files:     [],
          blocks: [
            { id: 1, name: 'Calentamiento',                  type: 'Física',  duration: 15, description: 'Movilidad articular + rondos 4v2.' },
            { id: 2, name: 'Ejercicio de pase en triángulos', type: 'Técnica', duration: 25, description: 'Triángulos de 10m. Pase-control-pase en 2 toques.' },
            { id: 3, name: 'Partido posicional 5v5',          type: 'Táctica', duration: 30, description: 'Posesión con zonas prohibidas. Premio a los pases consecutivos.' },
            { id: 4, name: 'Vuelta a la calma',               type: 'Física',  duration: 10, description: 'Estiramientos en parejas.' }
          ],
          createdAt: serverTimestamp()
        },
        {
          title:     'Táctica defensiva en bloque medio',
          date:      dateIn(5),
          time:      '17:00',
          duration:  90,
          category:  'Táctica',
          intensity: 'Alta',
          objectives: 'Organizar la defensa en bloque medio y trabajar la salida controlada.',
          materials: 'Balones, conos, petos',
          players:   [],
          files:     [],
          blocks: [
            { id: 1, name: 'Activación táctica',         type: 'Física',  duration: 15, description: 'Posicionamiento inicial y organización defensiva estática.' },
            { id: 2, name: 'Defensa 8v8 en bloque',       type: 'Táctica', duration: 30, description: 'Bloque defensivo medio-bajo. Pressing al portador al recuperar.' },
            { id: 3, name: 'Transición defensa-ataque',   type: 'Táctica', duration: 25, description: 'Salida rápida en 3 segundos al recuperar el balón.' },
            { id: 4, name: 'Partido condicionado',        type: 'Táctica', duration: 15, description: 'Aplicación de los conceptos trabajados en partido 8v8.' }
          ],
          createdAt: serverTimestamp()
        }
      ];

      for (const session of sampleSessions) {
        await addDoc(sessionsRef, session);
      }
    }

    // ─── 3. PARTIDO ────────────────────────────────────────────────────────────
    const matchesRef = collection(db, teamPath, 'matches');
    const matchesSnap = await getDocs(matchesRef);

    if (matchesSnap.empty) {
      const today = new Date();
      const matchDate = new Date(today);
      matchDate.setDate(today.getDate() + 7);
      const matchDateStr = matchDate.toISOString().split('T')[0];

      await addDoc(matchesRef, {
        rival: 'Escuela Deportiva Ejemplo',
        fecha: matchDateStr,
        hora: '11:00',
        lugar: 'Campo Municipal',
        esLocal: false,
        convocados: playerIds,      // IDs de los jugadores de muestra
        titulares: [],
        suplentes: [],
        formacion: '4-3-3',
        resultado: { local: null, visitante: null },
        goles: [],
        tarjetas: [],
        cambios: [],
        minutosJugados: {},
        valoraciones: {},
        notas: 'Partido de muestra. Edita o elimina este registro.',
        createdAt: serverTimestamp()
      });
    }

  } catch (err) {
    // No bloquear el flujo principal si el seed falla
    console.error('[seedInitialData] Error insertando datos de muestra:', err);
  }
};
