import React, { useState } from 'react';
import { ScadaProvider, useScada } from './state/ScadaContext';
import { WorkbenchProvider } from './workbench/WorkbenchContext';
import { WorkbenchShell } from './workbench/WorkbenchShell';
import { LandingScreen } from './components/LandingScreen';
import { LoginScreen } from './components/LoginScreen';
import { DocumentationPage } from './pages/DocumentationPage';

const ScadaContent: React.FC = () => {
  const { operator, login } = useScada();
  const [welcomeView, setWelcomeView] = useState<'LANDING' | 'LOGIN' | 'DOCS'>('LOGIN');

  // If operator is not authenticated, show login / landing / preview docs
  if (!operator.authenticated) {
    if (welcomeView === 'LANDING') {
      return (
        <LandingScreen
          onEnter={() => setWelcomeView('LOGIN')}
          onDocs={() => setWelcomeView('DOCS')}
        />
      );
    }
    if (welcomeView === 'DOCS') {
      return (
        <div className="h-screen w-screen bg-[#080e18] p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-4">
            <button
              onClick={() => setWelcomeView('LOGIN')}
              className="text-xs text-scada-cyan hover:underline font-mono"
            >
              ← Back to Login Screen
            </button>
            <DocumentationPage />
          </div>
        </div>
      );
    }
    return <LoginScreen onBack={() => setWelcomeView('LANDING')} />;
  }

  // Operator is authenticated -> Enter ANSYS-Inspired Engineering Workbench
  return (
    <WorkbenchProvider>
      <WorkbenchShell />
    </WorkbenchProvider>
  );
};

export default function App() {
  return (
    <ScadaProvider>
      <ScadaContent />
    </ScadaProvider>
  );
}
