/**
 * calcularEdad.js
 * Utilidad robusta para calcular la edad a partir de fechaNacimiento.
 * Soporta: Timestamp de Firestore, string ISO (YYYY-MM-DD), string DD/MM/YYYY, Date nativo.
 */

/**
 * @param {any} fechaNacimiento - Puede ser Timestamp Firestore, string o Date
 * @returns {{ text: string, cat: string }} - Texto de edad y categoría formativa
 */
export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return { text: 'Sin edad', cat: 'N/A' };

  let fecha;

  // Caso 1: Timestamp de Firestore (tiene método .toDate())
  if (fechaNacimiento?.toDate && typeof fechaNacimiento.toDate === 'function') {
    fecha = fechaNacimiento.toDate();

  // Caso 2: String de fecha
  } else if (typeof fechaNacimiento === 'string') {
    const trimmed = fechaNacimiento.trim();

    // Validar que no sea un string de categoría o texto libre ("juvenil", "cadete", etc.)
    // Una fecha válida debe tener al menos un dígito y un separador
    if (!/\d/.test(trimmed)) return { text: 'Sin edad', cat: 'N/A' };

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
    return { text: 'Sin edad', cat: 'N/A' };
  }

  // Validar que la fecha parseada es válida
  if (!fecha || isNaN(fecha.getTime())) return { text: 'Sin edad', cat: 'N/A' };

  // Validar rango razonable (entre 1990 y hoy)
  const hoy = new Date();
  if (fecha > hoy || fecha.getFullYear() < 1990) return { text: 'Sin edad', cat: 'N/A' };

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

  return { text: `${edad} años`, cat };
};
