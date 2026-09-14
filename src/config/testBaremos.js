/**
 * src/config/testBaremos.js
 * Baremos canónicos oficiales de pruebas físicas y técnicas de Míster11.
 * 
 * DEF-M08-01: Baremo de Salto Horizontal Pies Juntos diferenciado por género.
 * Fuente: Real Federación Española de Fútbol (RFEF) - Baremos de Condición Física en Fútbol Formativo Femenino (Salto Horizontal Pies Juntos).
 */

export const RFEF_JUMP_SOURCE = 'Fuente: Real Federación Española de Fútbol (RFEF) - Baremos de Condición Física en Fútbol Formativo Femenino (Salto Horizontal Pies Juntos).';

export const jumpHorizontalBaremos = {
  source: RFEF_JUMP_SOURCE,
  female: {
    name: 'Fútbol Formativo Femenino (RFEF)',
    unit: 'cm',
    percentiles: [
      { p: 10, value: 110, score: 25, label: 'Bajo' },
      { p: 25, value: 125, score: 40, label: 'Mejorable' },
      { p: 50, value: 140, score: 50, label: 'Medio' },
      { p: 75, value: 155, score: 75, label: 'Bueno' },
      { p: 85, value: 160, score: 82, label: 'Sobresaliente' },
      { p: 90, value: 170, score: 90, label: 'Excelente' },
      { p: 99, value: 185, score: 99, label: 'Élite formativa' }
    ],
    evaluate: (cm) => {
      const num = Number(cm) || 0;
      if (num >= 185) return 99;
      if (num >= 170) return Math.round(90 + ((num - 170) / 15) * 9);
      if (num >= 160) return Math.round(82 + ((num - 160) / 10) * 8);
      if (num >= 155) return Math.round(75 + ((num - 155) / 5) * 7);
      if (num >= 140) return Math.round(50 + ((num - 140) / 15) * 25);
      return Math.min(99, Math.max(10, Math.round((num / 140) * 50)));
    }
  },
  male: {
    name: 'Fútbol Formativo Masculino / Mixto',
    unit: 'cm',
    percentiles: [
      { p: 10, value: 130, score: 25, label: 'Bajo' },
      { p: 25, value: 145, score: 40, label: 'Mejorable' },
      { p: 50, value: 165, score: 60, label: 'Medio' },
      { p: 75, value: 180, score: 75, label: 'Bueno' },
      { p: 90, value: 195, score: 90, label: 'Excelente' },
      { p: 99, value: 215, score: 99, label: 'Élite formativa' }
    ],
    evaluate: (cm) => {
      const num = Number(cm) || 0;
      if (num >= 215) return 99;
      if (num >= 195) return Math.round(90 + ((num - 195) / 20) * 9);
      if (num >= 180) return Math.round(75 + ((num - 180) / 15) * 15);
      if (num >= 165) return Math.round(60 + ((num - 165) / 15) * 15);
      return Math.min(99, Math.max(10, Math.round((num / 165) * 60)));
    }
  },
  calculateScore: (cm, gender = 'male') => {
    const isFemale = gender === 'female' || gender === 'femenino' || gender === 'F';
    return isFemale ? jumpHorizontalBaremos.female.evaluate(cm) : jumpHorizontalBaremos.male.evaluate(cm);
  }
};

export default jumpHorizontalBaremos;
