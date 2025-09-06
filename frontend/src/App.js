import React, { useState } from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { Toaster } from './components/ui/toaster';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScriptSection from './components/ScriptSection';
import StoryboardSection from './components/StoryboardSection';
import AnimationSection from './components/AnimationSection';
import SoundSection from './components/SoundSection';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-white">Загрузка Anix Flow...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'script':
        return <ScriptSection setActiveTab={setActiveTab} />;
      case 'storyboard':
        return <StoryboardSection setActiveTab={setActiveTab} />;
      case 'animation':
        return <AnimationSection setActiveTab={setActiveTab} />;
      case 'sound':
        return <SoundSection setActiveTab={setActiveTab} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <ProjectProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </ProjectProvider>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter basename="/anix_flow">
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;