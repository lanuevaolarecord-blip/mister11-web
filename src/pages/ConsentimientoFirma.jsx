import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import { Shield, PenTool, Check, Share2, Download } from 'lucide-react';
import './ConsentimientoFirma.css';

const ConsentimientoFirma = () => {
  const [searchParams] = useSearchParams();
  
  // Parámetros de la URL pasados por el entrenador
  const coachId = searchParams.get('coachId') || '';
  const teamId = searchParams.get('teamId') || '';
  const teamName = searchParams.get('teamName') || 'Míster11 Club';
  const coachName = searchParams.get('coachName') || 'el Entrenador';

  // Estados del formulario
  const [parentName, setParentName] = useState('');
  const [parentDni, setParentDni] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerDob, setPlayerDob] = useState('');
  const [relation, setRelation] = useState('Padre'); // Padre, Madre, Tutor
  const [acceptHealth, setAcceptHealth] = useState(false);
  const [acceptImage, setAcceptImage] = useState(false);
  
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Referencias para el canvas de firma
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  // Inicializar eventos de dibujo en el canvas (Soporte táctil y ratón)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1B3A2D'; // Verde Institucional
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Ajustar el tamaño del canvas al tamaño del contenedor CSS
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      // Volver a configurar el trazo después del cambio de tamaño
      ctx.strokeStyle = '#1B3A2D';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setIsSigned(false);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Obtener coordenadas ajustadas para móvil y escritorio
    const getCoordinates = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const startDrawing = (e) => {
      e.preventDefault();
      isDrawing.current = true;
      const coords = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    };

    const draw = (e) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const coords = getCoordinates(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setIsSigned(true);
    };

    const stopDrawing = () => {
      isDrawing.current = false;
    };

    // Eventos Mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Eventos Touch (Móvil)
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  };

  const handleGeneratePDF = async (e) => {
    e.preventDefault();
    if (!parentName || !parentDni || !playerName || !playerDob) {
      setError('Por favor, rellena todos los campos obligatorios del formulario.');
      return;
    }
    if (!acceptHealth) {
      setError('Debes autorizar obligatoriamente el tratamiento de datos de salud y lesiones para el funcionamiento deportivo.');
      return;
    }
    if (!isSigned) {
      setError('Por favor, firma el documento en la pantalla táctil antes de continuar.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // 1. Convertir firma del canvas a imagen base64
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');

      // 2. Crear documento PDF con jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [27, 58, 45]; // Verde Institucional (#1B3A2D)
      const accentColor = [76, 175, 125]; // Verde Acento (#4CAF7D)
      const textColor = [51, 51, 51];

      // Cabecera institucional
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('DOCUMENTO DE CONSENTIMIENTO MATERNO / PATERNO / TUTOR', 15, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text('Tratamiento de Datos Personales, Salud e Imagen bajo Reglamento General de Protección de Datos (RGPD)', 15, 25);
      
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(15, 28, 195, 28);

      // Datos declarados
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('1. DATOS DECLARADOS:', 15, 36);

      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre del Padre / Madre / Tutor: ${parentName}`, 15, 43);
      doc.text(`Documento de Identidad (DNI/NIE/Pasaporte): ${parentDni}`, 15, 49);
      doc.text(`En calidad de: ${relation}`, 15, 55);
      doc.text(`Nombre del Deportista (Menor): ${playerName}`, 15, 61);
      doc.text(`Fecha de Nacimiento del Deportista: ${playerDob}`, 15, 67);
      doc.text(`Club / Equipo: ${teamName}`, 15, 73);
      doc.text(`Entrenador Responsable: ${coachName}`, 15, 79);

      // Texto legal
      doc.setFont('helvetica', 'bold');
      doc.text('2. CLÁUSULAS DE CONSENTIMIENTO Y AUTORIZACIÓN:', 15, 89);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const legalText1 = `A. TRATAMIENTO DE DATOS DE SALUD Y LESIONES (Obligatorio): Autorizo expresamente al entrenador ${coachName} a registrar y procesar información médica, de fatiga y lesiones de mi hijo/tutorado en el software Míster11. Estos datos tienen como única finalidad adaptar las cargas de entrenamiento, evitar la reincidencia en lesiones y salvaguardar la integridad física del menor en el contexto deportivo.`;
      const splitText1 = doc.splitTextToSize(legalText1, 180);
      doc.text(splitText1, 15, 95);

      const legalText2 = `B. DERECHOS DE IMAGEN Y ANÁLISIS TÁCTICO: ${acceptImage ? 'AUTORIZO' : 'NO AUTORIZO'} al equipo a registrar fotografías o capturas de juego/posicionamiento de mi representado dentro del software Míster11 con fines estrictamente formativos, preparación táctica y análisis del juego.`;
      const splitText2 = doc.splitTextToSize(legalText2, 180);
      doc.text(splitText2, 15, 125);

      const legalText3 = `En cumplimiento del RGPD (UE) 2016/679 y la LOPDGDD 3/2018 de España, se le informa que el responsable del tratamiento de los datos es el club deportivo o entrenador a cargo de la gestión del equipo. Míster11 actúa únicamente como encargado del tratamiento facilitando la plataforma de software. Puede ejercer sus derechos de Acceso, Rectificación, Supresión u Oposición contactando con el club/entrenador o escribiendo al soporte técnico de la plataforma: mister11.app@gmail.com.`;
      const splitText3 = doc.splitTextToSize(legalText3, 180);
      doc.text(splitText3, 15, 145);

      // Firma digitalizada
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. DECLARACIÓN DE CONFORMIDAD Y FIRMA:', 15, 175);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text('Firmado digitalmente en pantalla táctil de dispositivo móvil.', 15, 182);
      doc.text(`Fecha de la Firma: ${new Date().toLocaleDateString()}`, 15, 188);

      // Añadir la firma del canvas al PDF
      doc.addImage(signatureDataUrl, 'PNG', 15, 195, 60, 30);
      doc.rect(15, 195, 60, 30); // Caja alrededor de la firma

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Firma del Padre/Madre/Tutor', 15, 230);
      doc.text('Documento de Consentimiento Digital Generado por Míster11.', 15, 280);

      // 3. Convertir PDF a Blob para compartir / descargar
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(pdfUrl);

      // 4. Guardar datos en la base de datos Firestore (colección pública consents)
      await addDoc(collection(db, 'consents'), {
        coachId,
        teamId,
        teamName,
        parentName,
        parentDni,
        playerName,
        playerDob,
        relation,
        acceptHealth,
        acceptImage,
        createdAt: new Date().toISOString(),
        signedIP: 'Firma Móvil Digitalizada'
      });

      // 5. Descargar automáticamente el PDF
      doc.save(`Consentimiento_Mister11_${playerName.replace(/\s+/g, '_')}.pdf`);
      
      setSubmitSuccess(true);
    } catch (err) {
      console.error("Error al registrar el consentimiento:", err);
      setError('Ocurrió un error al guardar tu consentimiento. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppShare = () => {
    const message = `Hola Entrenador, le envío el documento de consentimiento digital cumplimentado y firmado para el jugador ${playerName}. Se ha guardado en el sistema y se ha descargado el PDF en mi dispositivo.`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, '_blank');
  };

  if (submitSuccess) {
    return (
      <div className="consent-signed-container">
        <div className="consent-signed-card">
          <div className="success-icon-wrapper">
            <Check size={48} color="white" />
          </div>
          <h2>¡Firmado Correctamente!</h2>
          <p>El documento de consentimiento para <strong>{playerName}</strong> ha sido registrado y el PDF se ha descargado automáticamente en tu dispositivo.</p>
          
          <div className="signed-actions">
            <button className="btn-whatsapp-share" onClick={handleWhatsAppShare}>
              <Share2 size={18} style={{ marginRight: '8px' }} />
              Notificar al Entrenador por WhatsApp
            </button>

            {pdfBlobUrl && (
              <a href={pdfBlobUrl} download={`Consentimiento_Mister11_${playerName.replace(/\s+/g, '_')}.pdf`} className="btn-download-pdf">
                <Download size={18} style={{ marginRight: '8px' }} />
                Volver a Descargar PDF
              </a>
            )}
          </div>

          <p className="footer-notice">Puedes enviar el archivo PDF descargado directamente al entrenador por chat si este te lo solicita.</p>
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
        <div className="sp-team-badge">🛡️ {teamName}</div>
      </header>

      <main className="consent-form-main">
        <div className="consent-heading-block">
          <div className="sp-icon-wrapper">
            <Shield size={24} color="#1B3A2D" />
          </div>
          <h1>Consentimiento de Protección de Datos</h1>
          <p className="sub-title">Autorización obligatoria para el registro de menores en la plataforma deportiva Míster11.</p>
        </div>

        <form className="consent-form-card" onSubmit={handleGeneratePDF}>
          <h2>Detalles del Consentimiento</h2>
          <p className="instructions">Por favor, rellena los siguientes datos y firma en el panel inferior con tu dedo (o ratón).</p>

          <div className="form-grid">
            <div className="form-field">
              <label>Nombre del Padre / Madre / Tutor *</label>
              <input 
                type="text" 
                placeholder="Ej. Juan Pérez" 
                value={parentName} 
                onChange={e => setParentName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-field">
              <label>Documento de Identidad (DNI/NIE/Pasaporte) *</label>
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
                <option value="Tutor">Tutor / Representante Legal</option>
              </select>
            </div>

            <div className="form-field">
              <label>Nombre del Jugador (Menor) *</label>
              <input 
                type="text" 
                placeholder="Ej. Thiago Pérez" 
                value={playerName} 
                onChange={e => setPlayerName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-field">
              <label>Fecha de Nacimiento del Jugador *</label>
              <input 
                type="date" 
                value={playerDob} 
                onChange={e => setPlayerDob(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="legal-consent-boxes">
            <label className="checkbox-field">
              <input 
                type="checkbox" 
                checked={acceptHealth} 
                onChange={e => setAcceptHealth(e.target.checked)} 
                required 
              />
              <span className="checkbox-text">
                <strong>(Requerido) Autorizo el tratamiento de datos de salud y lesiones:</strong> Consiento que el cuerpo técnico procese datos referentes a mi hijo/tutorado sobre cansancio, lesiones y parámetros físicos para salvaguardar su integridad en el fútbol.
              </span>
            </label>

            <label className="checkbox-field">
              <input 
                type="checkbox" 
                checked={acceptImage} 
                onChange={e => setAcceptImage(e.target.checked)} 
              />
              <span className="checkbox-text">
                <strong>(Opcional) Autorizo el uso de imagen y capturas:</strong> Permito que se registren capturas fotográficas o posicionales tácticas en la plataforma Míster11 con fines puramente pedagógicos y de análisis de juego.
              </span>
            </label>
          </div>

          <div className="signature-section">
            <label className="signature-label">
              <PenTool size={16} style={{ marginRight: '6px' }} />
              Dibuja tu Firma Digital *
            </label>
            <div className="signature-pad-container">
              <canvas ref={canvasRef} className="signature-canvas" />
            </div>
            <div className="signature-pad-actions">
              <button type="button" className="btn-clear-sig" onClick={clearCanvas}>Limpiar panel de firma</button>
            </div>
          </div>

          {error && <div className="consent-error-message">⚠️ {error}</div>}

          <button type="submit" className="btn-submit-consent" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando Firma...' : '✍️ Generar PDF y Firmar Documento'}
          </button>
        </form>
      </main>

      <footer className="consent-page-footer">
        <p>© {new Date().getFullYear()} Míster11 · El banquillo en tu bolsillo</p>
      </footer>
    </div>
  );
};

export default ConsentimientoFirma;
