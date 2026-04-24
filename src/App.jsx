import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';
import PizarraTactica from './pages/PizarraTactica';
import MiEquipo from './pages/MiEquipo';
import Sesiones from './pages/Sesiones';
import Planificacion from './pages/Planificacion';
import Tests from './pages/Tests';
import Partidos from './pages/Partidos';
import Login from './pages/Login';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--carbon)', color: 'white'}}>Cargando Míster11...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pizarra" element={<PizarraTactica />} />
          <Route path="equipo" element={<MiEquipo />} />
          <Route path="sesiones" element={<Sesiones />} />
          <Route path="planificacion" element={<Planificacion />} />
          <Route path="tests" element={<Tests />} />
          <Route path="partidos" element={<Partidos />} />
          <Route path="ia-generadora" element={<PlaceholderPage title="IA GENERADORA" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
