/**
 * src/utils/consentVerification.js
 * B2-FIX — Verificación de consentimiento parental contra el REGISTRO (/consents), nunca contra el payload.
 *
 * - Edad: calcularEdad(...).years (NO parseInt sobre la fecha: '2012-05-10' => 2012 y nunca dispara).
 * - Firma: se busca un doc en /consents (teamId + nombre + fecha de nacimiento normalizados).
 *   Flags del payload (consentStatus/consentimientoFirmado/hasSignedConsent) se IGNORAN.
 * - Fecha desconocida/inválida => se trata como menor (fail-closed).
 * - Activación: sigue siendo [PENDIENTE-DUEÑO: CONSENTIMIENTO] (strictEnforced=false por defecto).
 */
import { calcularEdad } from './calcularEdad.js';

export const ADULT_AGE = 18;

export const normalizeName = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

/** Fecha -> 'YYYY-MM-DD' o '' si no se puede interpretar. */
export const normalizeDob = (v) => {
  if (!v) return '';
  if (v?.toDate && typeof v.toDate === 'function') v = v.toDate();
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10);
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{2})[/-](\d{2})[/-](\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return '';
};

export const isMinorByBirth = (birth) => {
  const years = calcularEdad(birth)?.years;
  // years===0 también significa "fecha ausente/ilegible": fail-closed => menor.
  return !(typeof years === 'number' && years >= ADULT_AGE);
};

/** Puro (testeable): ¿alguno de los docs de /consents corresponde a este jugador? */
export const matchConsent = (consentDocs, player, teamId) => {
  const name = normalizeName(player?.name || player?.nombre);
  const dob = normalizeDob(player?.fechaNacimiento || player?.birthDate);
  if (!name || !dob) return null;
  return (consentDocs || []).find((c) =>
    (!teamId || c.teamId === teamId) &&
    normalizeName(c.playerName) === name &&
    normalizeDob(c.playerDob) === dob
  ) || null;
};

/** Lectura real del registro (Firestore). Import dinámico: el módulo sigue siendo testeable sin firebase. */
export const fetchConsentsForTeam = async (teamId) => {
  const [{ db }, fs] = await Promise.all([import('../firebaseConfig.js'), import('firebase/firestore')]);
  const snap = await fs.getDocs(fs.query(fs.collection(db, 'consents'), fs.where('teamId', '==', teamId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * @param {object} playerData
 * @param {{strictEnforced?: boolean, teamId?: string, fetchConsents?: (teamId:string)=>Promise<object[]>}} opts
 */
export const validateUnderageConsent = async (playerData, opts = {}) => {
  const { strictEnforced = false, teamId, fetchConsents = fetchConsentsForTeam } = opts;
  if (!strictEnforced) return { allowed: true, reason: 'not_enforced' };
  const birth = playerData?.fechaNacimiento || playerData?.birthDate;
  if (!isMinorByBirth(birth)) return { allowed: true, reason: 'adult' };
  const docs = await fetchConsents(teamId);
  const found = matchConsent(docs, playerData, teamId);
  if (found) return { allowed: true, reason: 'consent_on_record', consentId: found.id || null };
  return {
    allowed: false,
    reason: 'parental_consent_missing',
    message: 'Consentimiento parental pendiente de firma digital (no consta en el registro) antes de dar de alta al menor'
  };
};

