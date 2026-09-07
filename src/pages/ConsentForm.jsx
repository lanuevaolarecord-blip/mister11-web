import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, PenTool, Check, Download, Info } from 'lucide-react';
import SignatureCanvas from '../components/SignatureCanvas';
import { useTranslation } from '../hooks/useTranslation';
import { drawPdfFooter } from '../utils/pdfTheme';
import '../styles/consent.css';

const ConsentForm = () => {
  const [searchParams] = useSearchParams();
  const { t, isEn, locale } = useTranslation();

  // Precargar parámetros de la URL opcionales
  const initialPlayerName = searchParams.get('playerName') || '';
  const initialTeamName = searchParams.get('teamName') || '';
  const initialCoachName = searchParams.get('coachName') || '';
  const initialSeason = searchParams.get('season') || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  // Estados de los campos
  const [parentName, setParentName] = useState('');
  const [parentDni, setParentDni] = useState('');
  const [relation, setRelation] = useState('Padre'); // Padre, Madre, Tutor
  const [parentPhone, setParentPhone] = useState('');
  
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [playerDob, setPlayerDob] = useState('');
  const [teamName, setTeamName] = useState(initialTeamName);
  const [season, setSeason] = useState(initialSeason);
  
  const [coachName, setCoachName] = useState(initialCoachName);

  // Estados de las 10 casillas de verificación (todas marcadas por defecto)
  const [authName, setAuthName] = useState(true);
  const [authDob, setAuthDob] = useState(true);
  const [authPosition, setAuthPosition] = useState(true);
  const [authBiometric, setAuthBiometric] = useState(true);
  const [authPhysicalTests, setAuthPhysicalTests] = useState(true);
  const [authPsychosocial, setAuthPsychosocial] = useState(true);
  const [authInjuries, setAuthInjuries] = useState(true);
  const [authAvatar, setAuthAvatar] = useState(true);
  const [authSessions, setAuthSessions] = useState(true);
  const [authExercises, setAuthExercises] = useState(true);

  // Estados de control del formulario
  const [isSigned, setIsSigned] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const signatureRef = useRef(null);

  // Resetea los campos si cambian los parámetros de búsqueda de la URL
  useEffect(() => {
    if (initialPlayerName) setPlayerName(initialPlayerName);
    if (initialTeamName) setTeamName(initialTeamName);
    if (initialCoachName) setCoachName(initialCoachName);
  }, [initialPlayerName, initialTeamName, initialCoachName]);

  useEffect(() => {
    document.title = `${t('consent.heading')} — Míster11`;
  }, [t]);

  const handleStroke = () => {
    setIsSigned(true);
    setError('');
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setIsSigned(false);
  };

  const validateForm = () => {
    if (!parentName.trim()) return t('consent.errParentName');
    if (!parentDni.trim()) return t('consent.errParentDni');
    if (!playerName.trim()) return t('consent.errPlayerName');
    if (!playerDob) return t('consent.errPlayerDob');
    
    // Al menos las autorizaciones básicas de identidad (nombre y fecha de nacimiento) deben estar marcadas
    if (!authName || !authDob) {
      return t('consent.errBasicAuth');
    }

    const signatureData = signatureRef.current?.getDataUrl();
    if (!isSigned || !signatureData) {
      return t('consent.errSig');
    }

    return null;
  };

  const handleGeneratePDF = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      // Hacer scroll hacia el mensaje de error
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      const signatureDataUrl = signatureRef.current.getDataUrl();

      // Crear documento PDF A4 vertical con jsPDF (carga diferida)
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [27, 58, 45]; // Verde Institucional (#1B3A2D)
      const accentColor = [76, 175, 125]; // Verde Acento (#4CAF7D)
      const textColor = [51, 51, 51];

      // Cabecera del Documento
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('MÍSTER11 — DOCUMENTO DE CONSENTIMIENTO PARENTAL DIGITAL', 15, 20);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('Tratamiento de Datos Personales, Salud y Rendimiento de Menores de Edad (RGPD / LOPDGDD)', 15, 25);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, 27, 195, 27);

      // Sección 1: Datos del Padre/Madre o Tutor Legal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('1. DATOS DEL PADRE, MADRE O REPRESENTANTE LEGAL', 15, 34);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`Nombre Completo: ${parentName}`, 15, 40);
      doc.text(`DNI / NIE / Pasaporte: ${parentDni}`, 15, 46);
      doc.text(`Relación con el menor: ${relation}`, 110, 46);
      doc.text(`Teléfono de contacto: ${parentPhone || 'No facilitado'}`, 15, 52);

      // Sección 2: Datos del Jugador y Entorno Deportivo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('2. DATOS DEL JUGADOR (MENOR DE EDAD) Y CLUB', 15, 60);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`Nombre y Apellidos del Menor: ${playerName}`, 15, 66);
      doc.text(`Fecha de Nacimiento: ${playerDob}`, 15, 72);
      doc.text(`Club / Escuela Deportiva: ${teamName || 'No especificado'}`, 15, 78);
      doc.text(`Temporada: ${season || 'No especificada'}`, 110, 78);
      doc.text(`Entrenador Responsable: ${coachName || 'No especificado'}`, 15, 84);

      // Sección 3: Autorizaciones específicas de datos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('3. AUTORIZACIONES ESPECÍFICAS DE TRATAMIENTO DE INFORMACIÓN', 15, 92);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      const startY = 98;
      const stepY = 6;
      
      const getStatusText = (val) => val ? '[X] AUTORIZADO' : '[ ] NO AUTORIZADO';

      doc.text(`${getStatusText(authName)} - Nombre, apellidos y ficha básica del deportista.`, 15, startY);
      doc.text(`${getStatusText(authDob)} - Fecha de nacimiento para control de categorías de edad.`, 15, startY + stepY);
      doc.text(`${getStatusText(authPosition)} - Posición deportiva en el campo de juego y número de dorsal.`, 15, startY + (stepY * 2));
      doc.text(`${getStatusText(authBiometric)} - Datos antropométricos básicos (altura, peso, IMC) para desarrollo físico.`, 15, startY + (stepY * 3));
      doc.text(`${getStatusText(authPhysicalTests)} - Resultados de pruebas y tests físicos de rendimiento deportivo.`, 15, startY + (stepY * 4));
      doc.text(`${getStatusText(authPsychosocial)} - Respuestas a cuestionarios psicosociales y test de bienestar.`, 15, startY + (stepY * 5));
      doc.text(`${getStatusText(authInjuries)} - Historial médico de lesiones (datos de salud - Art. 9 RGPD).`, 15, startY + (stepY * 6));
      doc.text(`${getStatusText(authAvatar)} - Foto de perfil o avatar identificativo dentro de la plantilla.`, 15, startY + (stepY * 7));
      doc.text(`${getStatusText(authSessions)} - Registro de asistencia, participación en entrenamientos y partidos.`, 15, startY + (stepY * 8));
      doc.text(`${getStatusText(authExercises)} - Asignación de planes de entrenamiento y ejercicios individualizados.`, 15, startY + (stepY * 9));

      // Sección 4: Información sobre protección de datos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('4. CLÁUSULA DE INFORMACIÓN Y RESPONSABILIDAD LEGAL', 15, startY + (stepY * 10) + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      const disclaimer = `En cumplimiento del Reglamento General de Protección de Datos (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD) en España, le informamos que el Responsable del Tratamiento de los datos de su representado es el Entrenador arriba indicado o, en su defecto, el Club Deportivo al cual pertenece el equipo. Míster11 actúa exclusivamente como Encargado del Tratamiento, facilitando la infraestructura técnica del software en la nube.\n\nEste documento se firma electrónicamente de manera puramente local en el dispositivo del firmante. Los datos aquí rellenados, la firma digitalizada y el documento PDF resultante NO se almacenan en los servidores de Míster11. Es responsabilidad exclusiva del firmante y del entrenador descargar y conservar de forma segura una copia física o digital de este consentimiento.`;
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
      doc.text(splitDisclaimer, 15, startY + (stepY * 10) + 9);

      // Sección 5: Firma y Fecha
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('5. FIRMA DIGITAL DEL PADRE / MADRE O TUTOR', 15, startY + (stepY * 10) + 44);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`Fecha de la Firma: ${new Date().toLocaleDateString('es-ES')}`, 15, startY + (stepY * 10) + 50);
      doc.text(`Firma digitalizada de conformidad:`, 15, startY + (stepY * 10) + 56);

      // Añadir imagen de la firma y dibujar un borde protector
      doc.addImage(signatureDataUrl, 'PNG', 15, startY + (stepY * 10) + 60, 50, 20);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.2);
      doc.rect(15, startY + (stepY * 10) + 60, 50, 20);

      // Pie de página legal unificado
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawPdfFooter(doc, 210, 297, i, totalPages);
      }

      // Generar descarga automática del PDF
      const filename = `Consentimiento_Parental_${playerName.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);

      // Crear URL de blob para permitir una segunda descarga si es necesario
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(blobUrl);
      
      setSuccess(true);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Ocurrió un error inesperado al generar el PDF. Por favor, vuelve a intentarlo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppNotify = () => {
    const message = t('consent.whatsappMsg', { name: playerName });
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (success) {
    return (
      <div className="consent-signed-container">
        <div className="consent-signed-card">
          <div className="success-icon-wrapper">
            <Check size={40} color="white" />
          </div>
          <h2>{t('consent.successTitle')}</h2>
          <p>
            {t('consent.successDesc', { name: playerName })}
          </p>

          <div className="signed-actions">
            <button className="btn-whatsapp-share" onClick={handleWhatsAppNotify}>
              {t('consent.notifyWhatsapp')}
            </button>
            {pdfBlobUrl && (
              <a href={pdfBlobUrl} download={`Consentimiento_Parental_${playerName.replace(/\s+/g, '_')}.pdf`} className="btn-download-pdf">
                <Download size={18} style={{ marginRight: '8px' }} />
                {t('consent.redownloadPdf')}
              </a>
            )}
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '20px' }}>
            <span style={{ display: 'flex', gap: '8px', color: '#1B3A2D', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
              <Info size={16} /> {t('consent.privacyTitle')}
            </span>
            <p className="consent-signed-card" style={{ fontSize: '12px', color: '#666', margin: '0', textAlign: 'left', border: 'none', padding: '0', boxShadow: 'none' }}>
              {t('consent.privacyDesc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="consent-page-container">
      <header className="consent-page-header">
        <div className="sp-logo-area">
          <img src="/logo_mister11.png" alt="Míster11" className="sp-logo-img" />
          <span className="sp-brand">MÍSTER 11</span>
        </div>
        {teamName && <div className="sp-team-badge">🛡️ {teamName}</div>}
      </header>

      <main className="consent-form-main">
        <div className="consent-heading-block">
          <div className="sp-icon-wrapper">
            <Shield size={24} color="#1B3A2D" />
          </div>
          <h1>{t('consent.heading')}</h1>
          <p className="sub-title">{t('consent.subTitle')}</p>
        </div>

        <form className="consent-form-card" onSubmit={handleGeneratePDF}>
          <h2>{t('consent.detailsTitle')}</h2>
          <p className="instructions">{t('consent.instructions')}</p>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>{t('consent.sec1')}</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>{t('consent.parentNameLabel')}</label>
              <input 
                type="text" 
                placeholder={t('consent.parentNamePlaceholder')} 
                value={parentName}
                onChange={e => setParentName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>{t('consent.parentDniLabel')}</label>
              <input 
                type="text" 
                placeholder={t('consent.parentDniPlaceholder')} 
                value={parentDni}
                onChange={e => setParentDni(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>{t('consent.relationLabel')}</label>
              <select value={relation} onChange={e => setRelation(e.target.value)}>
                <option value="Padre">{t('consent.relationFather')}</option>
                <option value="Madre">{t('consent.relationMother')}</option>
                <option value="Tutor Legal">{t('consent.relationGuardian')}</option>
              </select>
            </div>
            <div className="form-field">
              <label>{t('consent.parentPhoneLabel')}</label>
              <input 
                type="tel" 
                placeholder={t('consent.parentPhonePlaceholder')} 
                value={parentPhone}
                onChange={e => setParentPhone(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>{t('consent.sec2')}</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>{t('consent.playerNameLabel')}</label>
              <input 
                type="text" 
                placeholder={t('consent.playerNamePlaceholder')} 
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>{t('consent.playerDobLabel')}</label>
              <input 
                type="date" 
                value={playerDob}
                onChange={e => setPlayerDob(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>{t('consent.teamNameLabel')}</label>
              <input 
                type="text" 
                placeholder={t('consent.teamNamePlaceholder')} 
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>{t('consent.seasonLabel')}</label>
              <input 
                type="text" 
                placeholder="Ej. 2026/2027" 
                value={season}
                onChange={e => setSeason(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>{t('consent.sec3')}</h3>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '24px' }}>
            <div className="form-field">
              <label>{t('consent.coachNameLabel')}</label>
              <input 
                type="text" 
                placeholder={t('consent.coachNamePlaceholder')} 
                value={coachName}
                onChange={e => setCoachName(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>{t('consent.sec4')}</h3>
          <p className="instructions" style={{ margin: '0 0 12px 0' }}>{t('consent.sec4Desc')}</p>
          <div className="legal-consent-boxes">
            <label className="checkbox-field">
              <input type="checkbox" checked={authName} onChange={e => setAuthName(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authName')}</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authDob} onChange={e => setAuthDob(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authDob')}</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authPosition} onChange={e => setAuthPosition(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authPosition')}</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authBiometric} onChange={e => setAuthBiometric(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authBiometric')}</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authPhysicalTests} onChange={e => setAuthPhysicalTests(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authPhysicalTests')}</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authPsychosocial} onChange={e => setAuthPsychosocial(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authPsychosocial')}</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authInjuries} onChange={e => setAuthInjuries(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authInjuries')}</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authAvatar} onChange={e => setAuthAvatar(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authAvatar')}</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authSessions} onChange={e => setAuthSessions(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authSessions')}</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authExercises} onChange={e => setAuthExercises(e.target.checked)} />
              <span className="checkbox-text">{t('consent.authExercises')}</span>
            </label>
          </div>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>{t('consent.sec6')}</h3>
          <div className="signature-section">
            <label className="signature-label">
              <PenTool size={14} style={{ marginRight: '6px' }} />
              {t('consent.sigLabel')}
            </label>
            <div className="signature-pad-container">
              <SignatureCanvas ref={signatureRef} onStroke={handleStroke} />
            </div>
            <div className="signature-pad-actions">
              <button type="button" className="btn-clear-sig" onClick={handleClearSignature}>{t('consent.clearSig')}</button>
            </div>
          </div>

          {error && <div className="consent-error-message">⚠️ {error}</div>}

          <button type="submit" className="btn-submit-consent" disabled={isGenerating}>
            {isGenerating ? t('consent.submittingBtn') : t('consent.submitBtn')}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e1e8ed', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', fontSize: '13px', color: '#555' }}>
          <strong>🔒 {t('consent.privacyTitle')}:</strong> {t('consent.footerLegal')}
        </div>
      </main>

      <footer className="consent-page-footer">
        <p>© {new Date().getFullYear()} Míster11 · {t('app.slogan')}</p>
      </footer>
    </div>
  );
};

export default ConsentForm;
