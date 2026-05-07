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
          titulo: 'Técnica de pase y control',
          fecha: dateIn(2),
          hora: '17:00',
          duracion: 90,
          categoria: 'Técnica',
          objetivos: 'Mejorar la precisión del primer toque y la velocidad del pase corto.',
          material: ['balones', 'conos'],
          bloques: [
            { nombre: 'Calentamiento', tipo: 'Calentamiento', duracion: 15, descripcion: 'Movilidad articular + rondos 4v2.' },
            { nombre: 'Ejercicio de pase en triángulos', tipo: 'Técnica', duracion: 25, descripcion: 'Triángulos de 10m. Pase-control-pase en 2 toques.' },
            { nombre: 'Partido posicional 5v5', tipo: 'Táctica', duracion: 30, descripcion: 'Posesión con zonas prohibidas. Premio a los pases consecutivos.' },
            { nombre: 'Vuelta a la calma', tipo: 'Recuperación', duracion: 10, descripcion: 'Estiramientos en parejas.' }
          ],
          createdAt: serverTimestamp()
        },
        {
          titulo: 'Táctica defensiva en bloque medio',
          fecha: dateIn(5),
          hora: '17:00',
          duracion: 90,
          categoria: 'Táctica',
          objetivos: 'Organizar la defensa en bloque medio y trabajar la salida controlada.',
          material: ['balones', 'conos', 'petos'],
          bloques: [
            { nombre: 'Activación táctica', tipo: 'Calentamiento', duracion: 15, descripcion: 'Posicionamiento inicial y organización defensiva estática.' },
            { nombre: 'Defensa 8v8 en bloque', tipo: 'Táctica', duracion: 30, descripcion: 'Bloque defensivo medio-bajo. Pressing al portador al recuperar.' },
            { nombre: 'Transición defensa-ataque', tipo: 'Táctica', duracion: 25, descripcion: 'Salida rápida en 3 segundos al recuperar el balón.' },
            { nombre: 'Partido condicionado', tipo: 'Juego', duracion: 15, descripcion: 'Aplicación de los conceptos trabajados en partido 8v8.' }
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
