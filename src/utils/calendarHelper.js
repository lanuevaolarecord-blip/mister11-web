/**
 * Formatea un objeto Date de JS a formato UTC requerido por Google Calendar e ICS:
 * YYYYMMDDTHHmmSSZ
 * @param {Date} date - Objeto Date
 * @returns {string} Fecha formateada
 */
export const formatDateUTC = (date) => {
  if (!date || isNaN(date.getTime())) {
    date = new Date();
  }
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Escapa caracteres especiales según la especificación RFC 5545 iCalendar.
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export const escapeICSText = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
};

/**
 * Genera un enlace para agregar un evento a Google Calendar.
 * @param {Object} event - Datos del evento
 * @param {string} event.title - Título del evento
 * @param {Date} event.startDate - Fecha/hora inicio
 * @param {Date} event.endDate - Fecha/hora fin
 * @param {string} [event.description] - Descripción del evento
 * @param {string} [event.location] - Ubicación del evento
 * @returns {string} Enlace de Google Calendar
 */
export const generateGoogleCalendarUrl = (event) => {
  const start = formatDateUTC(event.startDate);
  const end = formatDateUTC(event.endDate);
  
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const text = encodeURIComponent(event.title || '');
  const dates = `${start}/${end}`;
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || '');

  return `${baseUrl}&text=${text}&dates=${dates}&details=${details}&location=${location}`;
};

/**
 * Genera el string iCalendar (.ics) para una lista de eventos.
 * @param {Array<Object>} events - Lista de eventos
 * @returns {string} Contenido del archivo .ics
 */
export const generateICSContent = (events) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mister11//Coaching App//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach((event, idx) => {
    const uid = event.id || `m11-event-${Date.now()}-${idx}@mister11.com`;
    const dtStamp = formatDateUTC(new Date());
    const dtStart = formatDateUTC(event.startDate);
    const dtEnd = formatDateUTC(event.endDate);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeICSText(event.title)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeICSText(event.location)}`);
    }
    lines.push('STATUS:CONFIRMED');
    lines.push('SEQUENCE:0');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

/**
 * Inicia la descarga automática de un archivo iCalendar (.ics) en el navegador.
 * @param {string} filename - Nombre del archivo (ej. 'calendario_entrenamientos.ics')
 * @param {string} icsContent - Contenido del archivo .ics
 */
export const downloadICSFile = (filename, icsContent) => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
