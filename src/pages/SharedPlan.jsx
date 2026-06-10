import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Shield, Activity, Calendar } from 'lucide-react';
import './SharedPlan.css';

const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} className="sp-md-h2">{line.replace('## ', '')}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="sp-md-h3">{line.replace('### ', '')}</h3>;
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="sp-md-bold"><strong>{line.replace(/\*\*/g, '')}</strong></p>;
    const boldMatch = line.match(/^\*\*(.+?):\*\* (.+)$/);
    if (boldMatch) return <p key={i} className="sp-md-p"><strong>{boldMatch[1]}:</strong> {boldMatch[2]}</p>;
    if (line.startsWith('- ')) return <li key={i} className="sp-md-li">{line.replace('- ', '')}</li>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="sp-md-p">{line}</p>;
  });
};

const SharedPlan = () => {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedPlan = async () => {
      try {
        setLoading(true);
        const planRef = doc(db, 'sharedPlans', planId);
        const planSnap = await getDoc(planRef);
        if (planSnap.exists()) {
          setPlan(planSnap.data());
        } else {
          setError('El plan de ejercicios solicitado no existe o ha expirado.');
        }
      } catch (err) {
        console.error("Error fetching shared plan:", err);
        setError('Error al cargar el plan de ejercicios.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedPlan();
  }, [planId]);

  if (loading) {
    return (
      <div className="shared-plan-loader">
        <div className="sp-spinner"></div>
        <p>Cargando plan de ejercicios...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="shared-plan-error-page">
        <div className="sp-error-card">
          <span className="sp-error-icon">⚠️</span>
          <h2>Atención</h2>
          <p>{error || 'No se pudo cargar el plan.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-plan-page">
      {/* Header simple y profesional */}
      <header className="shared-plan-header">
        <div className="sp-logo-area">
          <img src="/logo_mister11.png" alt="Míster11" className="sp-logo-img" />
          <span className="sp-brand">MÍSTER 11</span>
        </div>
        {plan.teamName && (
          <div className="sp-team-badge">
            🛡️ {plan.teamName}
          </div>
        )}
      </header>

      {/* Cuerpo principal del plan */}
      <main className="shared-plan-content">
        <div className="sp-title-block">
          <div className="sp-icon-wrapper">
            <Activity size={24} />
          </div>
          <h1>{plan.name || 'Rutina de Ejercicios'}</h1>
          <p className="sp-meta-info">Plan de entrenamiento asignado por tu entrenador.</p>
        </div>

        <div className="sp-exercises-list">
          {plan.exercises && plan.exercises.map((ex, idx) => (
            <div key={idx} className="sp-exercise-card">
              <div className="sp-ex-header">
                <div className="sp-ex-title-row">
                  <span className="sp-ex-number">{idx + 1}</span>
                  <h2>{ex.name}</h2>
                </div>
                <div className="sp-ex-frequency">
                  <Calendar size={14} /> {ex.frequency || 'Diario'}
                </div>
              </div>
              <div className="sp-ex-body">
                {renderMarkdown(ex.description)}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="shared-plan-footer">
        <p>© {new Date().getFullYear()} Míster11 · El banquillo en tu bolsillo</p>
      </footer>
    </div>
  );
};

export default SharedPlan;
