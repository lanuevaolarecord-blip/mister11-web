import React from 'react';
import './PlaceholderPage.css';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <div className="placeholder-icon">
          <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        </div>
        <h1>{title}</h1>
        <p>Estamos preparando este módulo para ofrecerte la mejor experiencia táctica.</p>
        <div className="loading-bar">
          <div className="loading-fill" />
        </div>
        <button className="btn-back" onClick={() => window.history.back()}>
          Volver atrás
        </button>
      </div>
    </div>
  );
};

export default PlaceholderPage;
