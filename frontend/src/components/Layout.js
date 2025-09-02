import React, { useState } from 'react';
import { Bot, Home, FileText, Image, Play, Volume2, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { logout } = useAuth();
  const { projects, currentProject, setCurrentProject } = useProject();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'script', label: 'Script', icon: FileText },
    { id: 'storyboard', label: 'Storyboard', icon: Image },
    { id: 'animation', label: 'Animation', icon: Play },
    { id: 'sound', label: 'Sound', icon: Volume2 }
  ];

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#161616]/80 backdrop-blur-xl border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="h-8 w-8 text-teal-400" />
              <div className="absolute inset-0 bg-teal-400/20 blur-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
                AnimAI Pro
              </h1>
              <p className="text-xs text-gray-400">Animation Studio</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-purple-500/20 border border-teal-400/30 text-teal-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Button>
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-[#161616]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
            {activeTab !== 'dashboard' && (
              <div className="text-gray-500">•</div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Project Selector */}
            {currentProject && (
              <Select value={currentProject.id} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-48 bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161616] border-white/20">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="text-white focus:bg-white/10">
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* User Area */}
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="h-8 w-8 bg-gradient-to-br from-teal-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                A
              </div>
              <span className="text-sm">Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;