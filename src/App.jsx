import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PizarraTactica from './pages/PizarraTactica';
import MiEquipo from './pages/MiEquipo';
import Sesiones from './pages/Sesiones';
import Planificacion from './pages/Planificacion';
import Tests from './pages/Tests';
import Partidos from './pages/Partidos';
import IAGeneradora from './pages/IAGeneradora';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Instalar from './pages/Instalar';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  // 4. Mientras onAuthStateChanged no ha respondido todavía, muestra pantalla de carga
  if (loading) {
    return (
      <div className="global-loader">
        <div className="loader-content">
          <div className="loader-logo">MÍSTER<span>11</span></div>
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // 5. Lógica de autenticación: Si devuelve un usuario, muestra la app; si devuelve null, muestra login
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />

      <Route 
        path="/instalar" 
        element={<Instalar />} 
      />

      <Route 
        path="/*" 
        element={user ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="pizarra" element={<PizarraTactica />} />
        <Route path="equipo" element={<MiEquipo />} />
        <Route path="sesiones" element={<Sesiones />} />
        <Route path="planificacion" element={<Planificacion />} />
        <Route path="tests" element={<Tests />} />
        <Route path="partidos" element={<Partidos />} />
        <Route path="ia-generadora" element={<IAGeneradora />} />
        <Route path="admin" element={<AdminPanel />} />
      </Route>
    </Routes>
  );
}

export default App;
