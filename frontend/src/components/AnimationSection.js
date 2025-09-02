import React, { useState } from 'react';
import { Play, Plus, RotateCcw, Send, Download, History, Square } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../hooks/use-toast';

const AnimationSection = ({ setActiveTab }) => {
  const { currentProject, updateProject } = useProject();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const handleAddKeyframe = (sceneId) => {
    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => {
        if (scene.id === sceneId) {
          return {
            ...scene,
            keyframes: [...scene.keyframes, {
              id: `keyframe_${Date.now()}`,
              type: 'keyframe',
              timestamp: scene.keyframes.length * 2,
              image: scene.image
            }]
          };
        }
        return scene;
      })
    };

    const updatedProject = { ...currentProject, animation: updatedAnimation };
    updateProject(updatedProject);

    toast({
      title: "Keyframe Added",
      description: "New keyframe has been added to the timeline.",
    });
  };

  const handleInterpolate = (sceneId, keyframeIndex) => {
    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => {
        if (scene.id === sceneId) {
          const newKeyframes = [...scene.keyframes];
          newKeyframes.splice(keyframeIndex + 1, 0, {
            id: `interpolated_${Date.now()}`,
            type: 'interpolated',
            timestamp: (newKeyframes[keyframeIndex].timestamp + (newKeyframes[keyframeIndex + 1]?.timestamp || newKeyframes[keyframeIndex].timestamp + 2)) / 2
          });
          
          return { ...scene, keyframes: newKeyframes };
        }
        return scene;
      })
    };

    const updatedProject = { ...currentProject, animation: updatedAnimation };
    updateProject(updatedProject);

    toast({
      title: "Interpolation Added",
      description: "Interpolated frames have been generated.",
    });
  };

  const handleRenderScene = async (sceneId) => {
    setIsProcessing(true);
    setRenderProgress(0);

    const progressInterval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    await new Promise(resolve => setTimeout(resolve, 2500));

    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => {
        if (scene.id === sceneId) {
          return { ...scene, rendered: true, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" };
        }
        return scene;
      })
    };

    const updatedProject = { ...currentProject, animation: updatedAnimation };
    updateProject(updatedProject);
    setIsProcessing(false);
    setRenderProgress(0);

    toast({
      title: "Scene Rendered",
      description: "Animation render completed successfully!",
    });
  };

  const handleRenderFullVideo = async () => {
    setIsProcessing(true);
    setRenderProgress(0);

    const progressInterval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 300);

    await new Promise(resolve => setTimeout(resolve, 5000));

    const updatedProject = {
      ...currentProject,
      animation: { ...currentProject.animation, rendered: true, fullVideoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" }
    };

    updateProject(updatedProject);
    setIsProcessing(false);
    setRenderProgress(0);

    toast({
      title: "Full Video Rendered",
      description: "Complete animation has been rendered!",
    });
    setActiveTab('sound');
  };

  // Initialize animation scenes from storyboard if not exists
  React.useEffect(() => {
    if (currentProject?.storyboard?.generated && (!currentProject.animation?.scenes || currentProject.animation.scenes.length === 0)) {
      const animationScenes = currentProject.storyboard.scenes.map(scene => ({
        id: scene.id,
        content: scene.content,
        image: scene.image,
        keyframes: [{
          id: `initial_${scene.id}`,
          type: 'keyframe',
          timestamp: 0,
          image: scene.image
        }],
        rendered: false
      }));

      const updatedProject = {
        ...currentProject,
        animation: { scenes: animationScenes, rendered: false }
      };
      updateProject(updatedProject);
    }
  }, [currentProject, updateProject]);

  if (!currentProject) {
    return <div className="p-6 text-white">No project selected</div>;
  }

  const hasStoryboard = currentProject.storyboard?.generated;
  const hasAnimationScenes = currentProject.animation?.scenes?.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Animation Timeline</h1>
          <p className="text-gray-400">Create keyframes and animate your scenes</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-teal-500/30 text-teal-300">
            {currentProject.animation?.rendered ? 'Rendered' : 'In Progress'}
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

      {!hasStoryboard ? (
        <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10 h-96 flex items-center justify-center">
          <div className="text-center">
            <Play className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Storyboard Available</h3>
            <p className="text-gray-400 mb-4">Create a storyboard first to start animating</p>
            <Button onClick={() => setActiveTab('storyboard')} variant="outline" className="border-teal-500/30 text-teal-300">
              Go to Storyboard
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Play className="h-5 w-5 mr-2 text-teal-400" />
                Animation Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasAnimationScenes && currentProject.animation.scenes.map((scene, sceneIndex) => (
                <div key={scene.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Scene {sceneIndex + 1}</h4>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddKeyframe(scene.id)}
                        className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Keyframe
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRenderScene(scene.id)}
                        disabled={isProcessing}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Render Scene
                      </Button>
                    </div>
                  </div>

                  {/* Timeline Track */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center space-x-2 overflow-x-auto">
                      {scene.keyframes.map((keyframe, index) => (
                        <div key={keyframe.id} className="flex items-center space-x-2 flex-shrink-0">
                          <div className={`relative group ${
                            keyframe.type === 'keyframe' 
                              ? 'bg-teal-500/20 border-teal-400/50' 
                              : 'bg-purple-500/20 border-purple-400/50'
                          } border rounded-lg p-3 min-w-[120px]`}>
                            {keyframe.image && (
                              <img 
                                src={keyframe.image} 
                                alt={`Keyframe ${index + 1}`}
                                className="w-full h-16 object-cover rounded mb-2"
                              />
                            )}
                            <div className="text-xs text-center">
                              <div className={keyframe.type === 'keyframe' ? 'text-teal-300' : 'text-purple-300'}>
                                {keyframe.type === 'keyframe' ? 'Keyframe' : 'Interpolated'}
                              </div>
                              <div className="text-gray-400">{keyframe.timestamp}s</div>
                            </div>
                          </div>

                          {index < scene.keyframes.length - 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInterpolate(scene.id, index)}
                              className="border-white/20 text-white hover:bg-white/10 flex-shrink-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {scene.rendered && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 text-sm">Scene rendered successfully</span>
                        <Button size="sm" variant="outline" className="ml-auto border-green-500/30 text-green-300">
                          <Play className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Render Progress */}
              {isProcessing && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">Rendering Animation...</span>
                    <span className="text-teal-400 text-sm">{renderProgress}%</span>
                  </div>
                  <Progress value={renderProgress} className="h-2" />
                </div>
              )}

              {/* Render Full Video */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleRenderFullVideo}
                  disabled={isProcessing || !hasAnimationScenes}
                  className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white border-0 px-8"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Render Full Video
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Next Step */}
          {currentProject.animation?.rendered && (
            <Card className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border-teal-400/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Animation Complete!</h3>
                  <p className="text-gray-300 mb-4">Ready to add sound and finalize your project?</p>
                  <Button 
                    onClick={() => setActiveTab('sound')}
                    className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white border-0"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Add Sound
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AnimationSection;