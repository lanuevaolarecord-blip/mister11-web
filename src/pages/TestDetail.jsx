import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './Tests.css';

const TEST_NAME_MAP = {
  'Inventario de Habilidades de Afrontamiento (ACSI-28)': 'Coping Skills Inventory (ACSI-28)',
  'Cuestionario de Fortaleza Mental (MTQ-10)': 'Mental Toughness Questionnaire (MTQ-10)',
  'Escala de Establecimiento de Metas': 'Goal Setting Scale',
  'Inventario de Liderazgo y Comunicación': 'Leadership & Communication Inventory',
  'Cuestionario de Cohesión de Equipo (GEQ)': 'Group Environment Questionnaire (GEQ)',
  'Escala de Bienestar Mental (MHC-SF)': 'Mental Health Continuum (MHC-SF)',
  'Test de Autoconciencia Emocional': 'Emotional Self-Awareness Test',
  'Escala de Empatía Deportiva': 'Sports Empathy Scale',
  'Cuestionario de Resolución de Conflictos': 'Conflict Resolution Questionnaire',
  'ACSI-28 (Habilidades de Afrontamiento)': 'ACSI-28 (Athletic Coping Skills)',
  'Escala de Autoconfianza': 'Self-Confidence Scale',
  'Ansiedad Competitiva (CSAI-2R)': 'Competitive Anxiety (CSAI-2R)',
  'Motivación Deportiva (SMS-II)': 'Sport Motivation Scale (SMS-II)',
  'Resiliencia en el Deporte': 'Sports Resilience',
  'Atención y Concentración': 'Attention & Concentration',
  'Cohesión de Equipo (GEQ)': 'Team Cohesion (GEQ)',
  'Escala de Deporte Limpio': 'Clean Sport Scale',
  'Habilidades Sociales': 'Social Skills',
  'Liderazgo Percibido': 'Perceived Leadership',
  'Satisfacción con el Entrenador': 'Coach Satisfaction',
  'IRES (Resiliencia en el Deporte)': 'IRES (Sports Resilience)',
  'GETS (Trabajo en Equipo para Jóvenes)': 'GETS (Youth Teamwork)',
  'CWMS (Bienestar Mental)': 'CWMS (Mental Well-Being)',
  'ECED (Cohesión en Equipos)': 'ECED (Team Cohesion)',
  'EDL (Deporte Limpio)': 'EDL (Clean Sport)'
};

const CATEGORY_MAP = {
  'resistencia': 'Endurance',
  'velocidad': 'Speed',
  'agilidad': 'Agility',
  'fuerza': 'Strength',
  'técnica': 'Technique',
  'tecnica': 'Technique',
  'afrontamiento': 'Coping',
  'fortaleza mental': 'Mental Toughness',
  'metas': 'Goals',
  'liderazgo': 'Leadership',
  'cohesión': 'Cohesion',
  'cohesion': 'Cohesion',
  'bienestar': 'Wellness',
  'autoconciencia': 'Self-Awareness',
  'empatía': 'Empathy',
  'empatia': 'Empathy',
  'conflictos': 'Conflicts',
  'evaluación': 'Evaluation',
  'evaluacion': 'Evaluation',
  'psicología': 'Psychology',
  'psicologia': 'Psychology',
  'sociología': 'Sociology',
  'sociologia': 'Sociology',
  'convivencia': 'Coexistence',
  'trabajo en equipo': 'Teamwork',
  'resiliencia': 'Resilience'
};

const QUESTION_MAP = {
  'Mantengo la calma cuando cometo un error.': 'I stay calm when I make a mistake.',
  'Me recupero rápidamente tras una mala jugada.': 'I recover quickly after a bad play.',
  'Me mantengo concentrado a pesar de las distracciones.': 'I stay focused despite distractions.',
  'Puedo enfocarme solo en la tarea actual.': 'I can focus only on the current task.',
  'Siento seguridad en mis capacidades antes del partido.': 'I feel confident in my abilities before the match.',
  'No dudo de mí mismo en momentos críticos.': 'I do not doubt myself in critical moments.',
  'Mantengo el control emocional cuando las cosas van mal.': 'I maintain emotional control when things go wrong.',
  'Cumplo con lo que me propongo hasta el final.': 'I follow through with what I set out to do until the end.',
  'Veo los problemas como oportunidades de mejora.': 'I see problems as opportunities for improvement.',
  'Confío en mi capacidad para superar obstáculos.': 'I trust in my ability to overcome obstacles.',
  'Planifico mis objetivos a corto y largo plazo.': 'I plan my short and long term goals.',
  'Sigo trabajando duro aunque no vea resultados inmediatos.': 'I keep working hard even if I do not see immediate results.',
  'Evalúo mi progreso regularmente.': 'I evaluate my progress regularly.',
  'Me comunico de forma clara y directa con mis compañeros.': 'I communicate clearly and directly with my teammates.',
  'Motivo a mis compañeros durante el juego.': 'I motivate my teammates during the game.',
  'Tomo buenas decisiones bajo presión.': 'I make good decisions under pressure.',
  'Todos en el equipo comparten el mismo objetivo.': 'Everyone on the team shares the same goal.',
  'Nos esforzamos juntos para alcanzar las metas.': 'We strive together to achieve our goals.',
  'Me llevo bien con mis compañeros fuera del campo.': 'I get along well with my teammates off the field.',
  'Disfruto pasar tiempo con el equipo.': 'I enjoy spending time with the team.',
  'Me siento feliz y positivo la mayor parte del tiempo.': 'I feel happy and positive most of the time.',
  'Siento que mi vida deportiva tiene propósito.': 'I feel my sports life has purpose.',
  'Siento que pertenezco y soy valorado en el equipo.': 'I feel that I belong and am valued in the team.',
  'Puedo identificar claramente lo que siento durante un partido.': 'I can clearly identify what I feel during a match.',
  'Sé cómo expresar mis emociones de manera adecuada.': 'I know how to express my emotions appropriately.',
  'Puedo calmarme cuando siento frustración.': 'I can calm down when I feel frustration.',
  'Entiendo cómo se sienten mis compañeros tras un error.': 'I understand how my teammates feel after a mistake.',
  'Me afecta emocionalmente el éxito o fracaso del equipo.': 'The success or failure of the team affects me emotionally.',
  'Busco soluciones en las que todos ganen.': 'I seek win-win solutions where everyone wins.',
  'Ayudo a resolver peleas entre compañeros.': 'I help resolve conflicts between teammates.',
  'Estoy dispuesto a ceder para llegar a un acuerdo.': 'I am willing to compromise to reach an agreement.'
};

const TestDetail = ({ test, players, onClose, onSave }) => {
  const { t, isEn } = useTranslation();
  const [selectedPlayerId, setSelectedPlayerId] = useState(players.length > 0 ? players[0].id : '');
  const [answers, setAnswers] = useState({});

  const displayName = isEn ? (TEST_NAME_MAP[test.name] || test.name) : test.name;
  const displayCat = isEn ? (CATEGORY_MAP[String(test.category).trim().toLowerCase()] || test.category) : test.category;

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: parseInt(value, 10)
    });
  };

  const handleSave = () => {
    if (!selectedPlayerId) return;

    let totalScore = 0;
    const dimensiones = {};

    test.questions.forEach(q => {
      const val = answers[q.id] || 0;
      totalScore += val;
      if (!dimensiones[q.dimension]) dimensiones[q.dimension] = 0;
      dimensiones[q.dimension] += val;
    });

    onSave(selectedPlayerId, {
      valor: totalScore,
      dimensiones,
      respuestas: answers
    });
    
    // Reset para el siguiente jugador o cerrar
    setAnswers({});
  };

  const isComplete = test.questions?.every(q => answers[q.id] !== undefined);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 56px)', maxHeight: 'calc(100dvh - 56px)', overflow: 'hidden', backgroundColor: '#FAF8F5' }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span className="t-cat" style={{backgroundColor: 'var(--accent-gold)', color: '#fff'}}>{displayCat}</span>
            <h2 style={{margin: 0}}>{displayName}</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        
        <div className="modal-body flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-24" style={{ padding: '20px 20px 100px 20px' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>{isEn ? 'Select Player to Evaluate' : 'Seleccionar Jugador a Evaluar'}</label>
            <select 
              value={selectedPlayerId} 
              onChange={e => {
                setSelectedPlayerId(e.target.value);
                setAnswers({});
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.number} - {p.name}</option>
              ))}
            </select>
          </div>

          <div className="protocolo-card" style={{ marginBottom: '20px', backgroundColor: '#f8fafc' }}>
            <h3>{isEn ? 'Instructions' : 'Instrucciones'}</h3>
            <p>{isEn ? 'Answer each question using the 1 to 5 scale, where 1 is "Strongly disagree / Never" and 5 is "Strongly agree / Always".' : 'Responde cada pregunta usando la escala del 1 al 5, donde 1 es "Totalmente en desacuerdo / Nunca" y 5 es "Totalmente de acuerdo / Siempre".'}</p>
          </div>

          <div className="questions-container">
            {test.questions && test.questions.map((q, index) => (
              <div key={q.id} className="question-card" style={{ marginBottom: '15px', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontWeight: '500', marginBottom: '10px' }}>{index + 1}. {isEn ? (QUESTION_MAP[q.text] || q.textEn || q.text) : q.text}</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map(val => (
                    <label key={val} style={{ 
                      display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', 
                      backgroundColor: answers[q.id] === val ? 'var(--theme-green)' : '#f1f5f9',
                      color: answers[q.id] === val ? '#fff' : '#334155',
                      borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input 
                        type="radio" 
                        name={q.id} 
                        value={val} 
                        checked={answers[q.id] === val}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        style={{ display: 'none' }}
                      />
                      {val}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Botones de acción integrados en la zona de scroll con padding inferior */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
              {Object.keys(answers).length} {isEn ? 'of' : 'de'} {test.questions?.length} {isEn ? 'answered' : 'respondidas'}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-outline" style={{ flex: 1, minHeight: '44px' }} onClick={onClose}>{t('common.cancel')}</button>
              <button 
                className="btn-primary" 
                onClick={handleSave}
                disabled={!isComplete}
                style={{ flex: 1, minHeight: '44px', opacity: isComplete ? 1 : 0.5, cursor: isComplete ? 'pointer' : 'not-allowed' }}
              >
                {t('tests.wellness.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetail;
