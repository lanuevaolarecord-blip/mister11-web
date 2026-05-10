import React from 'react';
import './UpgradeModal.css';

const UpgradeModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content upgrade-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="crown-icon">👑</div>
          <h2>¡Pásate a PRO!</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="upgrade-message">
            {message || "Has alcanzado el límite de tu plan gratuito. Actualiza para desbloquear todas las funciones sin límites."}
          </p>
          <ul className="benefits-list">
            <li>✅ Equipos y jugadores ilimitados</li>
            <li>✅ Exportación de informes a PDF</li>
            <li>✅ Historial de tests completo</li>
            <li>✅ Soporte prioritario</li>
          </ul>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Más tarde</button>
          <button className="btn-primary" onClick={() => alert("Próximamente: Integración con pasarela de pagos.")}>
            Actualizar Ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
