import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const WellnessTestModal = ({ isOpen, onClose, onSave, player }) => {
  const { t, isEn } = useTranslation();
  const [answers, setAnswers] = useState({
    sleep: 3,
    fatigue: 3,
    muscleSoreness: 3,
    stress: 3,
    mood: 3
  });

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleSave = () => {
    const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
    onSave({
      categoria: 'bienestar',
      jugadorId: player.id,
      nombreJugador: player.name,
      fecha: new Date().toISOString(),
      respuestas: answers,
      puntuacionTotal: totalScore,
      valor: totalScore // para compatibilidad con gráficos genéricos
    });
    onClose();
  };

  const questions = [
    { key: 'sleep', label: isEn ? 'Sleep Quality (1: Very Poor - 5: Excellent)' : 'Calidad del Sueño (1: Muy mala - 5: Excelente)' },
    { key: 'fatigue', label: isEn ? 'Fatigue (1: Very Fatigued - 5: Not Fatigued)' : 'Fatiga (1: Muy fatigado - 5: Nada fatigado)' },
    { key: 'muscleSoreness', label: isEn ? 'Muscle Soreness (1: Severe Pain - 5: Pain-Free)' : 'Dolor Muscular (1: Mucho dolor - 5: Sin dolor)' },
    { key: 'stress', label: isEn ? 'Stress Level (1: Highly Stressed - 5: Relaxed)' : 'Nivel de Estrés (1: Muy estresado - 5: Relajado)' },
    { key: 'mood', label: isEn ? 'Mood (1: Very Low - 5: Excellent)' : 'Estado de Ánimo (1: Muy malo - 5: Excelente)' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEn ? 'Wellness Questionnaire' : 'Cuestionario de Bienestar'}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isEn ? `Rate ${player?.name || 'player'} on a scale of 1 to 5.` : `Evalúa a ${player?.name || 'jugador'} en una escala de 1 a 5.`}
          </p>
          {questions.map(q => (
            <div key={q.key} className="form-group-team">
              <label>{q.label}</label>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={answers[q.key]} 
                onChange={e => handleChange(q.key, e.target.value)} 
                style={{ width: '100%', margin: '10px 0' }}
              />
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>{answers[q.key]}</div>
            </div>
          ))}
          <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', textAlign: 'center' }}>
            <strong>{isEn ? 'Total Score:' : 'Puntuación Total:'} {Object.values(answers).reduce((a, b) => a + b, 0)} / 25</strong>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={handleSave}>{t('tests.wellness.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default WellnessTestModal;
