import React, { useState } from 'react';
import { Wand2, RefreshCw, Send, Download, History, GripVertical, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../hooks/use-toast';
import { SCRIPT_PRESETS, NARRATOR_OPTIONS } from '../mock';

const ScriptSection = ({ setActiveTab }) => {
  const { currentProject, updateProject } = useProject();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNarrator, setSelectedNarrator] = useState('friendly');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [userPrompt, setUserPrompt] = useState(currentProject?.script?.userPrompt || '');
  const [deleteSceneIndex, setDeleteSceneIndex] = useState(null);

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedProject = {
      ...currentProject,
      script: {
        ...SCRIPT_PRESETS.primary,
        generated: true,
        narrator: selectedNarrator,
        userPrompt: userPrompt
      }
    };
    
    updateProject(updatedProject);
    setIsGenerating(false);
    
    toast({
      title: "Script Generated",
      description: "Your animation script has been created successfully!",
    });
  };

  const handleRegenerateScript = async () => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Toggle between presets
    const useAlternate = currentProject.script.title === SCRIPT_PRESETS.primary.title;
    const newPreset = useAlternate ? SCRIPT_PRESETS.alternate : SCRIPT_PRESETS.primary;
    
    const updatedProject = {
      ...currentProject,
      script: {
        ...newPreset,
        generated: true,
        narrator: selectedNarrator,
        userPrompt: userPrompt
      }
    };
    
    updateProject(updatedProject);
    setIsGenerating(false);
    
    toast({
      title: "Script Regenerated",
      description: "A new version of your script has been created!",
    });
  };

  const handleRegenerateScene = async (sceneIndex) => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create variation of the scene
    const scenes = [...currentProject.script.scenes];
    const originalContent = scenes[sceneIndex].content;
    
    // Simple variation by modifying the content slightly
    const variations = [
      originalContent.replace(/curious/g, 'eager').replace(/first time/g, 'very first moment'),
      originalContent.replace(/wobbly/g, 'unsteady').replace(/knocking over/g, 'accidentally hitting'),
      originalContent.replace(/twitching/g, 'flicking').replace(/observes/g, 'watches'),
      originalContent.replace(/stare/g, 'gaze').replace(/spark/g, 'moment')
    ];
    
    scenes[sceneIndex] = {
      ...scenes[sceneIndex],
      content: variations[sceneIndex] || originalContent
    };
    
    const updatedProject = {
      ...currentProject,
      script: {
        ...currentProject.script,
        scenes
      }
    };
    
    updateProject(updatedProject);
    setIsGenerating(false);
    
    toast({
      title: "Scene Regenerated",
      description: `Scene ${sceneIndex + 1} has been updated!`,
    });
  };

  const handleSceneContentChange = (sceneIndex, newContent) => {
    const scenes = [...currentProject.script.scenes];
    scenes[sceneIndex] = { ...scenes[sceneIndex], content: newContent };
    
    const updatedProject = {
      ...currentProject,
      script: { ...currentProject.script, scenes }
    };
    
    updateProject(updatedProject);
  };

  const handleUserPromptChange = (newPrompt) => {
    setUserPrompt(newPrompt);
    const updatedProject = {
      ...currentProject,
      script: { ...currentProject.script, userPrompt: newPrompt }
    };
    updateProject(updatedProject);
  };

  const handleAddScene = () => {
    const newScene = {
      id: `scene_${Date.now()}`,
      content: '',
      duration: 5
    };
    
    const scenes = [...(currentProject.script.scenes || []), newScene];
    const updatedProject = {
      ...currentProject,
      script: { ...currentProject.script, scenes }
    };
    
    updateProject(updatedProject);
    toast({
      title: "Scene Added",
      description: "New scene has been added to your script.",
    });
  };

  const handleDeleteScene = (sceneIndex) => {
    const scenes = [...currentProject.script.scenes];
    scenes.splice(sceneIndex, 1);
    
    const updatedProject = {
      ...currentProject,
      script: { ...currentProject.script, scenes }
    };
    
    updateProject(updatedProject);
    setDeleteSceneIndex(null);
    
    toast({
      title: "Scene Deleted",
      description: "Scene has been removed from your script.",
    });
  };

  const handleSendToStoryboard = () => {
    // Auto-populate storyboard when sending
    const storyboardScenes = currentProject.script.scenes.map(scene => ({
      id: scene.id,
      content: scene.content,
      image: `https://picsum.photos/seed/${scene.id}-realistic/800/450`,
      style: 'realistic',
      generated: true,
      history: [{
        id: `${scene.id}_initial`,
        image: `https://picsum.photos/seed/${scene.id}-realistic/800/450`,
        timestamp: new Date().toISOString(),
        style: 'realistic',
        prompt: null
      }]
    }));

    const updatedProject = {
      ...currentProject,
      storyboard: {
        scenes: storyboardScenes,
        style: 'realistic',
        generated: true
      }
    };

    updateProject(updatedProject);
    
    toast({
      title: "Sent to Storyboard",
      description: "Script has been sent and storyboard images auto-generated!",
    });
    setActiveTab('storyboard');
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const scenes = [...currentProject.script.scenes];
    const draggedScene = scenes[draggedIndex];
    
    scenes.splice(draggedIndex, 1);
    scenes.splice(dropIndex, 0, draggedScene);
    
    const updatedProject = {
      ...currentProject,
      script: { ...currentProject.script, scenes }
    };
    
    updateProject(updatedProject);
    setDraggedIndex(null);
    
    toast({
      title: "Scenes Reordered",
      description: "Scene order has been updated!",
    });
  };

  if (!currentProject) {
    return <div className="p-6 text-white">No project selected</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Script Generation</h1>
          <p className="text-gray-400">Create and refine your animation script</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-teal-500/30 text-teal-300">
            {currentProject.script.generated ? 'Generated' : 'Draft'}
          </Badge>
          <Button 
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button 
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Controls */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-teal-400" />
                Story Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Describe your animation story...</label>
                <Textarea
                  value={userPrompt}
                  onChange={(e) => handleUserPromptChange(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder-gray-500 resize-none focus:border-teal-400/50 focus:ring-teal-400/20 min-h-[80px]"
                  placeholder="A curious robot discovers friendship with a cat in a dusty laboratory..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Wand2 className="h-5 w-5 mr-2 text-teal-400" />
                AI Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Narrator Character</label>
                <Select value={selectedNarrator} onValueChange={setSelectedNarrator}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-white/20">
                    {NARRATOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white focus:bg-white/10">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleGenerateScript}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {currentProject.script.generated ? 'Regenerate Script' : 'Generate Script'}
                </Button>
                
                {currentProject.script.generated && (
                  <Button 
                    onClick={handleRegenerateScript}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Different Version
                  </Button>
                )}
              </div>

              {isGenerating && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-2 text-teal-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
                    <span className="text-sm">Generating script...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Script Info */}
          {currentProject.script.generated && (
            <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">{currentProject.script.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scenes:</span>
                    <span className="text-white">{currentProject.script.scenes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Narrator:</span>
                    <span className="text-white">{NARRATOR_OPTIONS.find(n => n.value === selectedNarrator)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Duration:</span>
                    <span className="text-white">
                      {currentProject.script.scenes?.reduce((sum, scene) => sum + scene.duration, 0) || 0}s
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Script Content */}
        <div className="lg:col-span-2">
          {currentProject.script.generated ? (
            <div className="space-y-4">
              {currentProject.script.scenes?.map((scene, index) => (
                <Card 
                  key={scene.id}
                  className="bg-[#161616]/60 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-200"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-gray-500 cursor-move" />
                        <CardTitle className="text-white text-lg">Scene {index + 1}</CardTitle>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                          {scene.duration}s
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegenerateScene(index)}
                          disabled={isGenerating}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteSceneIndex(index)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={scene.content}
                      onChange={(e) => handleSceneContentChange(index, e.target.value)}
                      className="bg-white/5 border-white/20 text-white placeholder-gray-500 resize-none focus:border-teal-400/50 focus:ring-teal-400/20 min-h-[100px]"
                      placeholder="Scene description..."
                    />
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Scene Button */}
              <Card className="bg-[#161616]/40 backdrop-blur-xl border-white/10 border-dashed hover:border-white/20 transition-colors">
                <CardContent className="p-6">
                  <Button 
                    onClick={handleAddScene}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Scene
                  </Button>
                </CardContent>
              </Card>
              
              {/* Send to Storyboard */}
              <Card className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border-teal-400/30 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Script Complete!</h3>
                    <p className="text-gray-300 mb-4">Ready to create visual storyboards for your scenes?</p>
                    <Button 
                      onClick={handleSendToStoryboard}
                      className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white border-0"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to Storyboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10 h-96 flex items-center justify-center">
              <div className="text-center">
                <Wand2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Script Generated</h3>
                <p className="text-gray-400 mb-4">Add your story description and click "Generate Script" to create your animation script</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Scene Confirmation Dialog */}
      <AlertDialog open={deleteSceneIndex !== null} onOpenChange={() => setDeleteSceneIndex(null)}>
        <AlertDialogContent className="bg-[#161616] border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Scene</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete Scene {deleteSceneIndex !== null ? deleteSceneIndex + 1 : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteScene(deleteSceneIndex)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Scene
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScriptSection;