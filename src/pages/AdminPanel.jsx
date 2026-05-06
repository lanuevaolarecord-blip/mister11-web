import React, { useState, useEffect } from 'react';
import { useTeams } from '../hooks/useTeams';
import { useSettings } from '../hooks/useSettings';
import { useExercises } from '../hooks/useExercises';
import { usePlayers } from '../hooks/usePlayers';
import { useSessions } from '../hooks/useSessions';
import { useMatches } from '../hooks/useMatches';
import { 
  Users, 
  Dumbbell, 
  FileText, 
  Settings, 
  Plus, 
  Trash2, 
  Download,
  Calendar,
  Layers,
  CheckCircle
} from 'lucide-react';
import { generateSeasonReport, generateMatchConvocation, generateSessionPDF } from '../utils/pdfGenerator';
import { t } from '../i18n/translations';
import { usePWA } from '../hooks/usePWA';
import { useTheme } from '../context/ThemeContext';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('equipos');
  const { teams, activeTeam, addTeam, deleteTeam, selectTeam } = useTeams();
  const { exercises, removeExercise } = useExercises(activeTeam?.id);
  const { players } = usePlayers(activeTeam?.id);
  const { sessions } = useSessions(activeTeam?.id);
  const { matches } = useMatches(activeTeam?.id);

  const [newTeam, setNewTeam] = useState({ nombre: '', categoria: '', temporada: '2025-26' });
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  
  const { settings, saveSettings, loading: loadingSettings } = useSettings(activeTeam?.id);
  const { darkMode, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState({ profileName: '', specialty: 'Primer Entrenador' });
  const [clubData, setClubData] = useState({ clubName: '', primaryColor: '#1B3A2D', secondaryColor: '#4CAF7D' });
  const [prefData, setPrefData] = useState({ notifications: true, language: 'Español (ES)' });
  const { deferredPrompt, isInstalled, installApp } = usePWA();

  // Sync state when settings load
  useEffect(() => {
    if (settings) {
      setProfileData({ 
        profileName: settings.profileName || '', 
        specialty: settings.specialty || 'Primer Entrenador' 
      });
      setClubData({ 
        clubName: settings.clubName || '', 
        primaryColor: settings.primaryColor || '#1B3A2D', 
        secondaryColor: settings.secondaryColor || '#4CAF7D' 
      });
      setPrefData({ 
        notifications: settings.notifications ?? true, 
        language: settings.language || 'Español (ES)' 
      });
    }
  }, [settings]);

  const handleAddTeam = async () => {
    if (!newTeam.nombre) return;
    await addTeam(newTeam);
    setNewTeam({ nombre: '', categoria: '', temporada: '2025-26' });
  };

  const handleSaveProfile = async () => {
    try {
      await saveSettings({ ...settings, ...profileData });
      alert("Perfil guardado correctamente.");
    } catch (e) {
      alert("Error al guardar perfil.");
    }
  };

  const handleUpdateClub = async () => {
    try {
      await saveSettings({ ...settings, ...clubData });
      alert("Club actualizado correctamente.");
    } catch (e) {
      alert("Error al actualizar club.");
    }
  };

  const toggleSetting = async (key, val = null) => {
    const newValue = val !== null ? val : !prefData[key];
    const updatedPrefs = { ...prefData, [key]: newValue };
    setPrefData(updatedPrefs);
    await saveSettings({ ...settings, ...updatedPrefs });
  };

  const handleExportSeason = () => {
    if (!activeTeam) { alert('Selecciona un equipo primero.'); return; }
    generateSeasonReport(activeTeam, players, matches);
  };

  const handleExportConvocatoria = () => {
    if (!selectedMatchId) { alert('Selecciona un partido primero.'); return; }
    const match = matches.find(m => m.id === selectedMatchId);
    if (!match) { alert('Partido no encontrado.'); return; }
    generateMatchConvocation(match, players);
  };

  const handleExportSession = () => {
    if (!selectedSessionId) { alert('Selecciona una sesión primero.'); return; }
    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) { alert('Sesión no encontrada.'); return; }
    generateSessionPDF(session);
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <button 
          className={`admin-nav-item ${activeTab === 'equipos' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipos')}
        >
          <Users size={20} /> <span>Equipos</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'biblioteca' ? 'active' : ''}`}
          onClick={() => setActiveTab('biblioteca')}
        >
          <Dumbbell size={20} /> <span>Ejercicios IA</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'exportar' ? 'active' : ''}`}
          onClick={() => setActiveTab('exportar')}
        >
          <FileText size={20} /> <span>Informes PDF</span>
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'ajustes' ? 'active' : ''}`}
          onClick={() => setActiveTab('ajustes')}
        >
          <Settings size={20} /> <span>Ajustes</span>
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'equipos' && (
          <div className="admin-section">
            <header className="section-header">
              <h2>Gestión de Equipos</h2>
              <p>Crea y gestiona tus plantillas para cada temporada.</p>
            </header>

            <div className="add-team-card">
              <h3>Nuevo Equipo</h3>
              <div className="form-row">
                <input 
                  type="text" 
                  placeholder="Nombre (ej. Infantil A)" 
                  value={newTeam.nombre}
                  onChange={e => setNewTeam({...newTeam, nombre: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Categoría" 
                  value={newTeam.categoria}
                  onChange={e => setNewTeam({...newTeam, categoria: e.target.value})}
                />
                <button className="btn-primary" onClick={handleAddTeam}><Plus size={18}/> Crear</button>
              </div>
            </div>

            <div className="teams-grid">
              {teams.map(team => {
                if (!team) return null;
                return (
                  <div key={team.id} className={`team-admin-card ${activeTeam?.id === team.id ? 'active' : ''}`}>
                    <div className="team-badge" style={{background: team.colorLocal || 'var(--accent)'}}>
                      {(team.nombre || '').charAt(0)}
                    </div>
                  <div className="team-info">
                    <h4>{team.nombre}</h4>
                    <span>{team.categoria} | {team.temporada}</span>
                  </div>
                    <div className="team-actions">
                      <button className="btn-select" onClick={() => selectTeam(team)}>
                        {activeTeam?.id === team.id ? <CheckCircle size={18}/> : 'Seleccionar'}
                      </button>
                      <button className="btn-delete-icon" onClick={() => deleteTeam(team.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'biblioteca' && (
          <div className="admin-section">
            <header className="section-header">
              <h2>Biblioteca de Ejercicios</h2>
              <p>Tus tácticas generadas por la IA guardadas en la nube.</p>
            </header>
            
            <div className="exercise-list-admin">
              {exercises.length === 0 && <p className="empty-msg">No hay ejercicios guardados aún.</p>}
              {exercises.map(ex => {
                if (!ex) return null;
                return (
                  <div key={ex.id} className="exercise-row">
                    <div className="ex-info">
                      <strong>{ex.title || ex.name || ex.exerciseName || ex.titulo || ex.nombre || 'Ejercicio sin nombre'}</strong>
                      <span>{ex.objetivo} | {ex.categoria}</span>
                    </div>
                    <div className="ex-actions">
                      <button className="btn-delete-icon" onClick={() => removeExercise(ex.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'exportar' && (
          <div className="admin-section">
            <header className="section-header">
              <h2>Centro de Exportación</h2>
              <p>Genera informes profesionales en PDF para tu club o cuerpo técnico.</p>
            </header>

            <div className="export-grid">
              <div className="export-card">
                <FileText className="export-icon" size={32} />
                <h3>Informe de Temporada</h3>
                <p>Estadísticas completas, minutos de jugadores y resumen de tests.</p>
                <button className="btn-export" onClick={handleExportSeason}>
                  <Download size={18} /> Generar PDF
                </button>
              </div>

              <div className="export-card">
                <Users className="export-icon" size={32} />
                <h3>Lista de Convocados</h3>
                <p>Selecciona un partido próximo para generar la hoja de convocatoria.</p>
                <select
                  className="admin-select-export"
                  value={selectedMatchId}
                  onChange={e => setSelectedMatchId(e.target.value)}
                >
                  <option value="">Seleccionar Partido...</option>
                  {matches.map(m => {
                    if (!m) return null;
                    return <option key={m.id} value={m.id}>{m.rival} ({m.fecha})</option>
                  })}
                </select>
                <button className="btn-export outline" onClick={handleExportConvocatoria}>
                  <Download size={18} /> Exportar
                </button>
              </div>

              <div className="export-card">
                <Calendar className="export-icon" size={32} />
                <h3>Ficha de Sesión</h3>
                <p>Exporta el detalle de una sesión de entrenamiento específica.</p>
                <select
                  className="admin-select-export"
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                >
                  <option value="">Seleccionar Sesión...</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.titulo} ({s.fecha})</option>
                  ))}
                </select>
                <button className="btn-export outline" onClick={handleExportSession}>
                  <Download size={18} /> Exportar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ajustes' && (
          <div className="admin-section">
            <header className="section-header">
              <h2>Ajustes del Sistema</h2>
              <p>Personaliza tu experiencia y la identidad visual de tu club.</p>
            </header>

            <div className="settings-grid">
              {/* CONFIGURACIÓN DE CUENTA */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Users size={20} />
                  <h3>Perfil del Entrenador</h3>
                </div>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Nombre Completo</label>
                    <input 
                      type="text" 
                      placeholder="Tu nombre" 
                      value={profileData.profileName} 
                      onChange={(e) => setProfileData({...profileData, profileName: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Especialidad / Cargo</label>
                    <select 
                      className="admin-select-input"
                      value={profileData.specialty}
                      onChange={(e) => setProfileData({...profileData, specialty: e.target.value})}
                    >
                      <option>Primer Entrenador</option>
                      <option>Asistente Técnico</option>
                      <option>Preparador Físico</option>
                      <option>Analista</option>
                    </select>
                  </div>
                  <button className="btn-save-settings" onClick={handleSaveProfile}>{t('btn.save', settings.language)} Perfil</button>
                </div>
              </div>

              {/* CONFIGURACIÓN DEL CLUB */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Layers size={20} />
                  <h3>Identidad del Club</h3>
                </div>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Nombre del Club</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Real Madrid C.F." 
                      value={clubData.clubName} 
                      onChange={(e) => setClubData({...clubData, clubName: e.target.value})}
                    />
                  </div>
                  <div className="form-row-dual">
                    <div className="form-group">
                      <label>Color Principal</label>
                      <input 
                        type="color" 
                        value={clubData.primaryColor} 
                        onChange={(e) => setClubData({...clubData, primaryColor: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Color Secundario</label>
                      <input 
                        type="color" 
                        value={clubData.secondaryColor} 
                        onChange={(e) => setClubData({...clubData, secondaryColor: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Escudo del Club (.png / .svg)</label>
                    <div className="upload-placeholder" onClick={() => alert('Selector de archivos abierto')}>
                      <Download size={20} />
                      <span>Subir Imagen</span>
                    </div>
                  </div>
                  <button className="btn-save-settings" onClick={handleUpdateClub}>{t('btn.save', settings.language)} Club</button>
                </div>
              </div>

              {/* PREFERENCIAS DE LA APP */}
              <div className="settings-card">
                <div className="card-header-icon">
                  <Settings size={20} />
                  <h3>Preferencias</h3>
                </div>
                <div className="settings-form">
                  <div className="toggle-group">
                    <span>Notificaciones de Sesión</span>
                    <div 
                      className={`toggle-switch ${prefData.notifications ? 'active' : ''}`}
                      onClick={() => toggleSetting('notifications')}
                    ></div>
                  </div>
                  <div className="toggle-group">
                    <span>Modo Oscuro</span>
                    <div 
                      className={`toggle-switch ${darkMode ? 'active' : ''}`}
                      onClick={toggleTheme}
                    ></div>
                  </div>
                  <div className="form-group" style={{marginTop: '15px'}}>
                    <label>Idioma del Sistema</label>
                    <select 
                      className="admin-select-input"
                      value={prefData.language}
                      onChange={(e) => toggleSetting('language', e.target.value)}
                    >
                      <option>Español (ES)</option>
                      <option>English (EN)</option>
                    </select>
                  </div>

                  {deferredPrompt && !isInstalled && (
                    <button 
                      className="btn-primary" 
                      onClick={installApp}
                      style={{ marginTop: '20px', width: '100%' }}
                    >
                      Instalar App (PWA)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
