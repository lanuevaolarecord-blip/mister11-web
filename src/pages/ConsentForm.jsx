import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import { Shield, PenTool, Check, Download, Info } from 'lucide-react';
import SignatureCanvas from '../components/SignatureCanvas';
import '../styles/consent.css';

const ConsentForm = () => {
  const [searchParams] = useSearchParams();

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
    if (!parentName.trim()) return 'El nombre del padre/madre/tutor es obligatorio.';
    if (!parentDni.trim()) return 'El DNI/NIE/Pasaporte del tutor es obligatorio.';
    if (!playerName.trim()) return 'El nombre del jugador (menor) es obligatorio.';
    if (!playerDob) return 'La fecha de nacimiento del jugador es obligatoria.';
    
    // Al menos las autorizaciones básicas de identidad (nombre y fecha de nacimiento) deben estar marcadas
    if (!authName || !authDob) {
      return 'Es obligatorio autorizar el tratamiento del nombre y fecha de nacimiento para poder registrar al jugador en la aplicación.';
    }

    const signatureData = signatureRef.current?.getDataUrl();
    if (!isSigned || !signatureData) {
      return 'Por favor, dibuja tu firma digital en el recuadro antes de continuar.';
    }

    return null;
  };

  const handleGeneratePDF = (e) => {
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

      // Crear documento PDF A4 vertical con jsPDF
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

      // Pie de página legal
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text('Míster11 - El banquillo en tu bolsillo · Consentimiento Parental 100% Privado (Sin registros en servidor).', 15, 285);

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
    const message = `Hola entrenador, ya he rellenado y firmado digitalmente el consentimiento parental para ${playerName}. He descargado el PDF firmado en mi dispositivo. Te lo comparto a continuación.`;
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
          <h2>¡Firmado con Éxito!</h2>
          <p>
            El documento de consentimiento parental para el jugador <strong>{playerName}</strong> se ha generado y descargado en tu dispositivo correctamente.
          </p>

          <div className="signed-actions">
            <button className="btn-whatsapp-share" onClick={handleWhatsAppNotify}>
              Notificar al Entrenador por WhatsApp
            </button>
            {pdfBlobUrl && (
              <a href={pdfBlobUrl} download={`Consentimiento_Parental_${playerName.replace(/\s+/g, '_')}.pdf`} className="btn-download-pdf">
                <Download size={18} style={{ marginRight: '8px' }} />
                Volver a descargar PDF
              </a>
            )}
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '20px' }}>
            <span style={{ display: 'flex', gap: '8px', color: '#1B3A2D', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
              <Info size={16} /> AVISO DE PRIVACIDAD
            </span>
            <p className="consent-signed-card" style={{ fontSize: '12px', color: '#666', margin: '0', textAlign: 'left', border: 'none', padding: '0', boxShadow: 'none' }}>
              Este documento ha sido generado de manera local. <strong>Míster11 no almacena copias de tu firma ni del consentimiento en sus servidores</strong>. Envía el PDF descargado al entrenador por WhatsApp para que lo conserve de forma segura.
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
          <h1>Consentimiento Parental Digital</h1>
          <p className="sub-title">Autorización informada para la gestión deportiva del jugador menor de edad.</p>
        </div>

        <form className="consent-form-card" onSubmit={handleGeneratePDF}>
          <h2>Detalles del Consentimiento</h2>
          <p className="instructions">Cumplimente los datos requeridos. Los campos marcados con (*) son obligatorios.</p>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>1. Datos del Padre, Madre o Tutor</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Nombre del Tutor *</label>
              <input 
                type="text" 
                placeholder="Nombre y Apellidos" 
                value={parentName}
                onChange={e => setParentName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>DNI / NIE / Pasaporte *</label>
              <input 
                type="text" 
                placeholder="Ej. 12345678Z" 
                value={parentDni}
                onChange={e => setParentDni(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>Parentesco *</label>
              <select value={relation} onChange={e => setRelation(e.target.value)}>
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Tutor Legal">Tutor Legal / Representante</option>
              </select>
            </div>
            <div className="form-field">
              <label>Teléfono de Contacto</label>
              <input 
                type="tel" 
                placeholder="Opcional" 
                value={parentPhone}
                onChange={e => setParentPhone(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>2. Datos del Deportista (Menor)</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Nombre del Jugador *</label>
              <input 
                type="text" 
                placeholder="Nombre y Apellidos" 
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>Fecha de Nacimiento *</label>
              <input 
                type="date" 
                value={playerDob}
                onChange={e => setPlayerDob(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>Club o Escuela Deportiva</label>
              <input 
                type="text" 
                placeholder="Nombre del Club" 
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Temporada</label>
              <input 
                type="text" 
                placeholder="Ej. 2026/2027" 
                value={season}
                onChange={e => setSeason(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>3. Datos del Entrenador</h3>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '24px' }}>
            <div className="form-field">
              <label>Nombre del Entrenador Responsable</label>
              <input 
                type="text" 
                placeholder="Nombre del técnico" 
                value={coachName}
                onChange={e => setCoachName(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>4. Autorizaciones de Datos Personales</h3>
          <p className="instructions" style={{ margin: '0 0 12px 0' }}>Seleccione qué datos autoriza que sean procesados en Míster11 por el cuerpo técnico:</p>
          <div className="legal-consent-boxes">
            <label className="checkbox-field">
              <input type="checkbox" checked={authName} onChange={e => setAuthName(e.target.checked)} />
              <span className="checkbox-text">Nombre y apellidos (Requerido para la ficha del jugador)</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authDob} onChange={e => setAuthDob(e.target.checked)} />
              <span className="checkbox-text">Fecha de nacimiento (Requerido para el cálculo automático de edad y categoría)</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authPosition} onChange={e => setAuthPosition(e.target.checked)} />
              <span className="checkbox-text">Posición deportiva y número de dorsal asignado</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authBiometric} onChange={e => setAuthBiometric(e.target.checked)} />
              <span className="checkbox-text">Ficha antropométrica (altura y peso corporal para el seguimiento físico e IMC)</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authPhysicalTests} onChange={e => setAuthPhysicalTests(e.target.checked)} />
              <span className="checkbox-text">Resultados de pruebas y tests físicos de aptitud y rendimiento</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authPsychosocial} onChange={e => setAuthPsychosocial(e.target.checked)} />
              <span className="checkbox-text">Cuestionarios psicosociales y tests diarios de bienestar (fatiga, sueño, estrés, humor)</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authInjuries} onChange={e => setAuthInjuries(e.target.checked)} />
              <span className="checkbox-text">Historial clínico de lesiones sufridas (datos médicos de salud - Art. 9 RGPD)</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authAvatar} onChange={e => setAuthAvatar(e.target.checked)} />
              <span className="checkbox-text">Fotografía o avatar identificativo del jugador en las alineaciones y pizarra</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authSessions} onChange={e => setAuthSessions(e.target.checked)} />
              <span className="checkbox-text">Registros de asistencia y participación en partidos, alineaciones e informes técnicos</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={authExercises} onChange={e => setAuthExercises(e.target.checked)} />
              <span className="checkbox-text">Asignación de planes de entrenamiento de recuperación e individuales</span>
            </label>
          </div>

          <h3 style={{ fontSize: '14px', color: '#1B3A2D', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>5. Firma del Tutor</h3>
          <div className="signature-section">
            <label className="signature-label">
              <PenTool size={14} style={{ marginRight: '6px' }} />
              Dibuja tu Firma con el Dedo o Ratón *
            </label>
            <div className="signature-pad-container">
              <SignatureCanvas ref={signatureRef} onStroke={handleStroke} />
            </div>
            <div className="signature-pad-actions">
              <button type="button" className="btn-clear-sig" onClick={handleClearSignature}>Limpiar panel de firma</button>
            </div>
          </div>

          {error && <div className="consent-error-message">⚠️ {error}</div>}

          <button type="submit" className="btn-submit-consent" disabled={isGenerating}>
            {isGenerating ? 'Generando PDF...' : '✍️ Generar PDF y Descargar Consentimiento'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e1e8ed', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', fontSize: '13px', color: '#555' }}>
          <strong>🔒 Privacidad garantizada:</strong> Míster11 no almacena tus datos de contacto, la firma ni el archivo PDF en sus bases de datos. El documento PDF se procesa de forma temporal e instantánea en la memoria de tu propio navegador móvil/ordenador. La custodia legal del documento PDF firmado recae enteramente en los padres/tutores y en el entrenador a cargo de la gestión del equipo.
        </div>
      </main>

      <footer className="consent-page-footer">
        <p>© {new Date().getFullYear()} Míster11 · El banquillo en tu bolsillo</p>
      </footer>
    </div>
  );
};

export default ConsentForm;
