import React, { createContext, useContext, useState, useEffect } from 'react';
import { SCRIPT_PRESETS, SAMPLE_PROJECTS } from '../mock';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

const createNewProject = () => ({
  id: `project_${Date.now()}`,
  name: `New Project ${Date.now()}`,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  status: 'Draft',
  thumbnail: "https://picsum.photos/seed/new-project/300/200",
  script: {
    ...SCRIPT_PRESETS.primary,
    generated: false
  },
  storyboard: {
    scenes: [],
    style: 'realistic',
    generated: false
  },
  animation: {
    scenes: [],
    keyframes: [],
    rendered: false
  },
  sound: {
    voiceover: [],
    music: [],
    sfx: [],
    finalized: false
  }
});

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load projects from localStorage
    const savedProjects = localStorage.getItem('animai_projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      setProjects(parsedProjects);
      if (parsedProjects.length > 0) {
        setCurrentProject(parsedProjects[0]);
      }
    } else {
      // Initialize with sample projects
      const initialProjects = SAMPLE_PROJECTS.map(project => ({
        ...createNewProject(),
        ...project,
        script: { ...SCRIPT_PRESETS.primary, generated: true }
      }));
      setProjects(initialProjects);
      setCurrentProject(initialProjects[0]);
      localStorage.setItem('animai_projects', JSON.stringify(initialProjects));
    }
    setIsLoading(false);
  }, []);

  const saveProjects = (updatedProjects) => {
    setProjects(updatedProjects);
    localStorage.setItem('animai_projects', JSON.stringify(updatedProjects));
  };

  const createProject = () => {
    const newProject = createNewProject();
    const updatedProjects = [newProject, ...projects];
    saveProjects(updatedProjects);
    setCurrentProject(newProject);
    return newProject;
  };

  const updateProject = (updatedProject) => {
    const updatedProjects = projects.map(p => 
      p.id === updatedProject.id ? { ...updatedProject, lastModified: new Date().toISOString() } : p
    );
    saveProjects(updatedProjects);
    setCurrentProject(updatedProject);
  };

  const deleteProject = (projectId) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjects(updatedProjects);
    if (currentProject?.id === projectId) {
      setCurrentProject(updatedProjects[0] || null);
    }
  };

  const duplicateProject = (projectId) => {
    const projectToDuplicate = projects.find(p => p.id === projectId);
    if (projectToDuplicate) {
      const duplicatedProject = {
        ...projectToDuplicate,
        id: `project_${Date.now()}`,
        name: `${projectToDuplicate.name} (Copy)`,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      const updatedProjects = [duplicatedProject, ...projects];
      saveProjects(updatedProjects);
      return duplicatedProject;
    }
  };

  const value = {
    projects,
    currentProject,
    setCurrentProject,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};