import React, { useState } from 'react';
import { Image as ImageIcon, Wand2, RefreshCw, Send, Download, History, ArrowUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../hooks/use-toast';
import { IMAGE_PRESETS, IMAGE_STYLES } from '../mock';

const StoryboardSection = ({ setActiveTab }) => {
  const { currentProject, updateProject } = useProject();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('realistic');

  const handleGenerateImages = async () => {
    if (!currentProject.script.generated) {
      toast({
        title: "No Script Available",
        description: "Please generate a script first before creating storyboards.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const storyboardScenes = currentProject.script.scenes.map(scene => ({
      id: scene.id,
      content: scene.content,
      image: IMAGE_PRESETS[selectedStyle]?.[scene.id] || IMAGE_PRESETS.realistic[scene.id],
      style: selectedStyle,
      generated: true
    }));

    const updatedProject = {
      ...currentProject,
      storyboard: {
        scenes: storyboardScenes,
        style: selectedStyle,
        generated: true
      }
    };

    updateProject(updatedProject);
    setIsGenerating(false);

    toast({
      title: "Storyboard Generated",
      description: "Visual storyboards have been created for all scenes!",
    });
  };

  const handleRegenerateImage = async (sceneId) => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const scenes = currentProject.storyboard.scenes.map(scene => {
      if (scene.id === sceneId) {
        // Cycle through different styles for variation
        const styles = Object.keys(IMAGE_PRESETS);
        const currentIndex = styles.indexOf(scene.style);
        const nextStyle = styles[(currentIndex + 1) % styles.length];
        
        return {
          ...scene,
          image: IMAGE_PRESETS[nextStyle][sceneId],
          style: nextStyle
        };
      }
      return scene;
    });

    const updatedProject = {
      ...currentProject,
      storyboard: { ...currentProject.storyboard, scenes }
    };

    updateProject(updatedProject);
    setIsGenerating(false);

    toast({
      title: "Image Regenerated",
      description: "New variation has been generated!",
    });
  };

  const handleSendToAnimation = () => {
    if (!currentProject.storyboard.generated) {
      toast({
        title: "No Storyboard Available",
        description: "Please generate storyboards first.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sent to Animation",
      description: "Storyboards have been sent to the animation section!",
    });
    setActiveTab('animation');
  };

  if (!currentProject) {
    return <div className="p-6 text-white">No project selected</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Visual Storyboard</h1>
          <p className="text-gray-400">Generate images for your animation scenes</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-teal-500/30 text-teal-300">
            {currentProject.storyboard?.generated ? 'Generated' : 'Not Generated'}
          </Badge>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Generation Controls */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Wand2 className="h-5 w-5 mr-2 text-teal-400" />
                Image Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Image Style</label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-white/20">
                    {IMAGE_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value} className="text-white focus:bg-white/10">
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerateImages}
                disabled={isGenerating || !currentProject.script.generated}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Images
              </Button>

              {!currentProject.script.generated && (
                <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  Generate a script first to create storyboards
                </p>
              )}

              {isGenerating && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-2 text-teal-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
                    <span className="text-sm">Generating images...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {currentProject.storyboard?.generated && (
            <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Storyboard Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Images:</span>
                    <span className="text-white">{currentProject.storyboard.scenes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Style:</span>
                    <span className="text-white">{IMAGE_STYLES.find(s => s.value === selectedStyle)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resolution:</span>
                    <span className="text-white">800x450</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Storyboard Content */}
        <div className="lg:col-span-3">
          {currentProject.storyboard?.generated ? (
            <div className="space-y-6">
              {currentProject.storyboard.scenes.map((scene, index) => (
                <Card key={scene.id} className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">Scene {index + 1}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                          {scene.style}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegenerateImage(scene.id)}
                          disabled={isGenerating}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Upscale
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="relative overflow-hidden rounded-lg bg-white/5">
                          <img 
                            src={scene.image} 
                            alt={`Scene ${index + 1}`}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.target.src = "https://picsum.photos/800/450?grayscale";
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>800 x 450</span>
                          <span>{scene.style}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Scene Description</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{scene.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Send to Animation */}
              <Card className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border-teal-400/30 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Storyboard Complete!</h3>
                    <p className="text-gray-300 mb-4">Ready to animate your scenes?</p>
                    <Button 
                      onClick={handleSendToAnimation}
                      className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white border-0"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to Animation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10 h-96 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Storyboard Generated</h3>
                <p className="text-gray-400 mb-4">Generate images for your script scenes</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryboardSection;