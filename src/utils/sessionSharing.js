import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Normaliza y sanitiza una sesión para que no contenga valores undefined o referencias no serializables.
 */
export const sanitizeSessionPayload = (session, teamName = 'Míster11 Team') => {
  const cleanBlocks = (session.blocks || session.bloques || []).map((b, i) => ({
    id: b.id || `block_${i + 1}`,
    name: b.name || b.titulo || `Bloque ${i + 1}`,
    type: b.type || b.tipo || 'General',
    duration: Number(b.duration || b.tiempo || 15),
    description: b.description || b.descripcion || '',
    imageUrl: b.imageUrl || b.imagenProtocolo || b.image || b.photo || b.previewUrl || null,
  }));

  return {
    title: session.title || session.nombre || session.titulo || 'Sesión de Entrenamiento',
    category: session.category || session.categoria || 'Táctica',
    duration: Number(session.duration || session.duracion || 90),
    intensity: session.intensity || session.intensidad || 'Media',
    materials: session.materials || session.material || '',
    objectives: session.objectives || session.objetivo || '',
    date: session.date || session.fecha || new Date().toISOString().split('T')[0],
    time: session.time || session.hora || '18:00',
    blocks: cleanBlocks,
    linkedPizarraId: session.linkedPizarraId || null,
    teamName: teamName || 'Equipo Míster11',
    sharedAt: new Date().toISOString(),
  };
};

/**
 * Publica una sesión en Firestore en la colección 'sharedSessions' y devuelve la URL compartida.
 */
export const shareSessionToFirestore = async (session, user, team) => {
  if (!session) throw new Error('No hay datos de sesión para compartir.');
  
  const shareId = session.shareId || session.id || `m11_ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = {
    ...sanitizeSessionPayload(session, team?.nombre || team?.name || 'Míster11 Team'),
    shareId,
    id: shareId,
    sharedByEmail: user?.email || 'entrenador@mister11.app',
    sharedByName: user?.displayName || user?.email?.split('@')[0] || 'Entrenador Míster11',
  };

  const shareRef = doc(db, 'sharedSessions', shareId);
  await setDoc(shareRef, payload);

  const origin = window?.location?.origin || 'https://www.mister11.app';
  return {
    shareId,
    shareUrl: `${origin}/shared/session/${shareId}`,
    importUrl: `${origin}/sesiones?importShareId=${shareId}`,
  };
};

/**
 * Obtiene los datos de una sesión compartida desde Firestore.
 */
export const getSharedSession = async (shareId) => {
  if (!shareId) return null;
  const shareRef = doc(db, 'sharedSessions', shareId);
  const snap = await getDoc(shareRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
};

/**
 * Exporta una sesión como un archivo descargable .m11session (JSON).
 */
export const exportSessionToJSONFile = (session, teamName = 'Míster11') => {
  const payload = sanitizeSessionPayload(session, teamName);
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement('a');
  const safeName = (payload.title || 'sesion').toLowerCase().replace(/[^a-z0-9]/gi, '_');
  
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `mister11_sesion_${safeName}.m11session`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

/**
 * Exporta una sesión en formato iCalendar (.ics) estandarizado.
 */
export const exportSessionToICSFile = (session) => {
  const title = session.title || session.nombre || 'Entrenamiento Míster11';
  const description = (session.objectives || session.objetivo || 'Sesión de entrenamiento').replace(/\n/g, '\\n');
  const dateStr = (session.date || session.fecha || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const timeStr = (session.time || session.hora || '18:00').replace(':', '') + '00';
  
  const startTime = `${dateStr}T${timeStr}`;
  const durationMin = Number(session.duration || session.duracion || 90);
  
  const endDate = new Date(`${session.date || new Date().toISOString().split('T')[0]}T${session.time || '18:00'}:00`);
  endDate.setMinutes(endDate.getMinutes() + durationMin);
  const endYear = endDate.getFullYear();
  const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const endDay = String(endDate.getDate()).padStart(2, '0');
  const endHour = String(endDate.getHours()).padStart(2, '0');
  const endMin = String(endDate.getMinutes()).padStart(2, '0');
  const endTime = `${endYear}${endMonth}${endDay}T${endHour}${endMin}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Míster11//Gestión Deportiva//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:⚽ ${title}`,
    `DESCRIPTION:${description}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `LOCATION:${session.category || 'Campo de Entrenamiento'}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  link.href = url;
  link.setAttribute('download', `sesion_${safeName}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Lee y analiza un archivo cargado (.m11session o .json) devolviendo la sesión parseada.
 */
export const parseSessionFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No se ha proporcionado ningún archivo.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        if (!parsed.title && !parsed.nombre && !parsed.titulo) {
          throw new Error('El archivo no contiene una estructura válida de sesión Míster11.');
        }
        resolve(sanitizeSessionPayload(parsed));
      } catch (err) {
        reject(new Error('El archivo seleccionado no tiene un formato válido (.m11session o .json).'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
};
