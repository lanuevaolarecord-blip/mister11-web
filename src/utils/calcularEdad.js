/**
 * calcularEdad.js
 * Utilidad robusta para calcular la edad a partir de fechaNacimiento.
 * Soporta: Timestamp de Firestore, string ISO (YYYY-MM-DD), string DD/MM/YYYY, Date nativo.
 */

/**
 * @param {any} fechaNacimiento - Puede ser Timestamp Firestore, string o Date
 * @param {boolean} isEn - Indica si el resultado textual debe estar en inglés
 * @returns {{ text: string, years: number, age: number, cat: string }} - Texto de edad y categoría formativa
 */
export const calcularEdad = (fechaNacimiento, localeOrIsEn = false) => {
  let lang = 'es';
  if (typeof localeOrIsEn === 'boolean') {
    lang = localeOrIsEn ? 'en' : 'es';
  } else if (typeof localeOrIsEn === 'string') {
    const l = localeOrIsEn.toLowerCase();
    if (l.startsWith('en')) lang = 'en';
    else if (l.startsWith('fr')) lang = 'fr';
    else if (l.startsWith('pt')) lang = 'pt';
    else if (l.startsWith('id')) lang = 'id';
    else lang = 'es';
  }

  const formatNoAge = () => {
    switch (lang) {
      case 'en': return 'No age';
      case 'fr': return 'Sans âge';
      case 'pt': return 'Sem idade';
      case 'id': return 'Tanpa usia';
      default:   return 'Sin edad';
    }
  };

  const formatYears = (n) => {
    switch (lang) {
      case 'en': return `${n} ${n === 1 ? 'year old' : 'years old'}`;
      case 'fr': return `${n} ${n === 1 ? 'an' : 'ans'}`;
      case 'pt': return `${n} ${n === 1 ? 'ano' : 'anos'}`;
      case 'id': return `${n} tahun`;
      default:   return `${n} años`;
    }
  };

  const noAgeText = formatNoAge();
  if (!fechaNacimiento) return { text: noAgeText, years: 0, age: 0, cat: 'N/A' };

  // Caso especial: edad directa en años como número o string numérico
  const valNum = parseInt(fechaNacimiento);
  if (!isNaN(valNum) && valNum > 0 && valNum < 120 && !fechaNacimiento.toString().includes('-') && !fechaNacimiento.toString().includes('/')) {
    let cat = 'Sénior';
    if (valNum <= 5)       cat = 'Debutante';
    else if (valNum <= 7)  cat = 'Pre-benjamín';
    else if (valNum <= 9)  cat = 'Benjamín';
    else if (valNum <= 11) cat = 'Alevín';
    else if (valNum <= 13) cat = 'Infantil';
    else if (valNum <= 15) cat = 'Cadete';
    else if (valNum <= 18) cat = 'Juvenil';
    return { text: formatYears(valNum), years: valNum, age: valNum, cat };
  }

  let fecha;

  // Caso 1: Timestamp de Firestore (tiene método .toDate())
  if (fechaNacimiento?.toDate && typeof fechaNacimiento.toDate === 'function') {
    fecha = fechaNacimiento.toDate();

  // Caso 2: String de fecha
  } else if (typeof fechaNacimiento === 'string') {
    const trimmed = fechaNacimiento.trim();

    // Validar que no sea un string de categoría o texto libre ("juvenil", "cadete", etc.)
    // Una fecha válida debe tener al menos un dígito y un separador
    if (!/\d/.test(trimmed)) return { text: noAgeText, years: 0, age: 0, cat: 'N/A' };

    // Formato ISO: YYYY-MM-DD (el más común desde <input type="date">)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      fecha = new Date(trimmed + 'T00:00:00'); // Forzar medianoche local
    
    // Formato DD/MM/YYYY o DD-MM-YYYY
    } else if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(trimmed)) {
      const parts = trimmed.split(/[\/\-]/);
      fecha = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    
    // Cualquier otro intento
    } else {
      fecha = new Date(trimmed);
    }

  // Caso 3: Date nativo de JavaScript
  } else if (fechaNacimiento instanceof Date) {
    fecha = fechaNacimiento;

  // Caso 4: Número de timestamp Unix (ms)
  } else if (typeof fechaNacimiento === 'number') {
    fecha = new Date(fechaNacimiento);

  } else {
    return { text: noAgeText, years: 0, age: 0, cat: 'N/A' };
  }

  // Validar que la fecha parseada es válida
  if (!fecha || isNaN(fecha.getTime())) return { text: noAgeText, years: 0, age: 0, cat: 'N/A' };

  // Validar rango razonable (entre 1990 y hoy)
  const hoy = new Date();
  if (fecha > hoy || fecha.getFullYear() < 1990) return { text: noAgeText, years: 0, age: 0, cat: 'N/A' };

  // Calcular edad exacta
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const mes = hoy.getMonth() - fecha.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad--;

  // Determinar categoría formativa
  let cat = 'Sénior';
  if (edad <= 5)       cat = 'Debutante';
  else if (edad <= 7)  cat = 'Pre-benjamín';
  else if (edad <= 9)  cat = 'Benjamín';
  else if (edad <= 11) cat = 'Alevín';
  else if (edad <= 13) cat = 'Infantil';
  else if (edad <= 15) cat = 'Cadete';
  else if (edad <= 18) cat = 'Juvenil';

  return { text: formatYears(edad), years: edad, age: edad, cat };
};

