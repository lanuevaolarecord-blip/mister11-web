export const translations = {
  'Español (ES)': {
    'nav.dashboard': 'DASHBOARD',
    'nav.pizarra': 'PIZARRA TÁCTICA',
    'nav.equipo': 'MI EQUIPO',
    'nav.sesiones': 'SESIONES',
    'nav.planificacion': 'PLANIFICACIÓN',
    'nav.tests': 'TESTS',
    'nav.partidos': 'PARTIDOS',
    'nav.ia': 'IA GENERATOR',
    'nav.admin': 'ADMINISTRACIÓN',
    'btn.save': 'GUARDAR',
    'btn.delete': 'ELIMINAR',
    'btn.add': 'AÑADIR',
    'dashboard.welcome': 'Hola, {name}',
    'dashboard.activity': 'Esta es la actividad de tu equipo ({club}) para esta semana.'
  },
  'English (EN)': {
    'nav.dashboard': 'DASHBOARD',
    'nav.pizarra': 'TACTICAL BOARD',
    'nav.equipo': 'MY TEAM',
    'nav.sesiones': 'SESSIONS',
    'nav.planificacion': 'PLANNING',
    'nav.tests': 'TESTS',
    'nav.partidos': 'MATCHES',
    'nav.ia': 'AI GENERATOR',
    'nav.admin': 'ADMINISTRATION',
    'btn.save': 'SAVE',
    'btn.delete': 'DELETE',
    'btn.add': 'ADD',
    'dashboard.welcome': 'Hello, {name}',
    'dashboard.activity': "This is your team's ({club}) activity for this week."
  }
};

export const t = (key, language = 'Español (ES)', replacements = {}) => {
  const lang = translations[language] || translations['Español (ES)'];
  let text = lang[key] || key;
  
  Object.keys(replacements).forEach(r => {
    text = text.replace(`{${r}}`, replacements[r]);
  });
  
  return text;
};
