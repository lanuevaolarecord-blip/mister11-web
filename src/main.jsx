import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { TeamProvider } from './context/TeamContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PizarraProvider } from './context/PizarraContext.jsx'
import './index.css'
import App from './App.jsx'
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#1a2e1a' });
  StatusBar.setOverlaysWebView({ overlay: false });
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TeamProvider>
          <PizarraProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </PizarraProvider>
        </TeamProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
