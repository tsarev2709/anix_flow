import React, { useState } from 'react';
import { Plus, MoreVertical, Copy, Trash2, Play, Calendar, Clock, Edit3, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../hooks/use-toast';

const Dashboard = ({ setActiveTab }) => {
  const { projects, createProject, deleteProject, duplicateProject, setCurrentProject, updateProject } = useProject();
  const { toast } = useToast();
  const [deleteProjectId, setDeleteProjectId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateProject = () => {
    const newProject = createProject();
    toast({
      title: "Project Created",
      description: `"${newProject.name}" has been created successfully.`,
    });
    setActiveTab('script');
  };

  const handleOpenProject = (project) => {
    setCurrentProject(project);
    setActiveTab('script');
  };

  const handleDuplicateProject = (projectId) => {
    const duplicated = duplicateProject(projectId);
    if (duplicated) {
      toast({
        title: "Project Duplicated",
        description: `"${duplicated.name}" has been created.`,
      });
    }
  };

  const handleDeleteProject = (projectId) => {
    deleteProject(projectId);
    setDeleteProjectId(null);
    toast({
      title: "Project Deleted",
      description: "Project has been permanently deleted.",
    });
  };

  const handleStartEdit = (project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const handleSaveEdit = (projectId) => {
    if (editingName.trim() !== '') {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const updatedProject = { ...project, name: editingName.trim() };
        updateProject(updatedProject);
        toast({
          title: "Project Renamed",
          description: `Project renamed to "${editingName.trim()}".`,
        });
      }
    }
    setEditingProjectId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditingName('');
  };

  const handleKeyPress = (e, projectId) => {
    if (e.key === 'Enter') {
      handleSaveEdit(projectId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'In Progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-purple-500/10 rounded-2xl" />
        <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10 relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white mb-2">Салют, Демиург</CardTitle>
                <p className="text-gray-400">Создадим новую реальность с нуля?</p>
              </div>
              <Button 
                onClick={handleCreateProject}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0 transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Создать новую вселенную
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                    <Play className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{projects.length}</p>
                    <p className="text-sm text-gray-400">Вселенных в мультивселенной</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {projects.filter(p => p.status === 'In Progress').length}
                    </p>
                    <p className="text-sm text-gray-400">Идёт большой взрыв</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {projects.filter(p => p.status === 'Completed').length}
                    </p>
                    <p className="text-sm text-gray-400">Реальности стабилизированы</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Галерея миров</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="bg-[#161616]/60 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group">
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img 
                    src={project.thumbnail} 
                    alt={project.name}
                    className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className={`${getStatusColor(project.status)} border`}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    {editingProjectId === project.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, project.id)}
                          onBlur={() => handleSaveEdit(project.id)}
                          className="bg-white/10 border-white/20 text-white text-sm h-8"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(project.id)}
                          className="h-8 w-8 p-0 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white group-hover:text-teal-300 transition-colors duration-200 flex-1">
                          {project.name}
                        </h3>
                        <Button
                          size="sm"
                          onClick={() => handleStartEdit(project)}
                          className="h-6 w-6 p-0 bg-transparent hover:bg-white/10 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-gray-400 mt-1">
                      Хронос тронут: {formatDate(project.lastModified)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button 
                      size="sm"
                      onClick={() => handleOpenProject(project)}
                      className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 hover:border-teal-500/50"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Войти в реальность
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#161616] border-white/20">
                        <DropdownMenuItem 
                          onClick={() => handleStartEdit(project)}
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Переименовать вселенную
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDuplicateProject(project.id)}
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Клонировать реальность
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteProjectId(project.id)}
                          className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить из мультивселенной
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent className="bg-[#161616] border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Подтвердите аннигиляцию реальности. Действие необратимо. Вселенные не воскрешают.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/20 text-white hover:bg-white/10">
              Отменить апокалипсис
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteProject(deleteProjectId)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Стереть в ничто
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;