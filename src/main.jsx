import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { TeamProvider } from './context/TeamContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PizarraProvider } from './context/PizarraContext.jsx'
import { MatchProvider } from './context/MatchContext.jsx'
import './index.css'
import App from './App.jsx'
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native');
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#1a2e1a' });
  StatusBar.setOverlaysWebView({ overlay: false });
}


import { LanguageProvider, useLanguage } from './context/LanguageContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function AppWithLanguageKey() {
  const { language } = useLanguage();
  return <App key={language} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <TeamProvider>
              <PizarraProvider>
                <MatchProvider>
                  <BrowserRouter>
                    <AppWithLanguageKey />
                  </BrowserRouter>
                </MatchProvider>
              </PizarraProvider>
            </TeamProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
