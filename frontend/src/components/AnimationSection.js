import React, { useState } from 'react';
import { Play, Plus, RotateCcw, Send, Download, History, Edit, MessageSquare, RefreshCw, ArrowUp, Trash2, Paperclip, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Switch } from './ui/switch';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../hooks/use-toast';
import { IMAGE_PRESETS } from '../mock';
import VersionHistoryModal from './VersionHistoryModal';

const AnimationSection = ({ setActiveTab }) => {
  const { currentProject, updateProject } = useProject();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [selectedKeyframe, setSelectedKeyframe] = useState(null);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [modifyImages, setModifyImages] = useState([]);
  const [historyKeyframeId, setHistoryKeyframeId] = useState(null);
  const [imageResolution, setImageResolution] = useState('');
  const [goLiveSceneId, setGoLiveSceneId] = useState(null);
  const [goLivePrompt, setGoLivePrompt] = useState('');

  const handleAddKeyframe = (sceneId) => {
    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => {
        if (scene.id === sceneId) {
          const newKeyframe = {
            id: `keyframe_${Date.now()}`,
            type: 'keyframe',
            timestamp: scene.keyframes.length * 2,
            image: scene.image,
            history: [{
              id: `keyframe_history_${Date.now()}`,
              image: scene.image,
              timestamp: new Date().toISOString(),
              style: 'realistic',
              prompt: null
            }]
          };
          
          return {
            ...scene,
            keyframes: [...scene.keyframes, newKeyframe]
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

  const handleSelectKeyframe = (sceneId, keyframeId) => {
    setSelectedKeyframe({ sceneId, keyframeId });
    setImageResolution('');
  };

  const handleModifyImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModifyImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveModifyImage = (index) => {
    setModifyImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleModifyKeyframeWithPrompt = async (sceneId, keyframeId) => {
    if (!modifyPrompt.trim() && modifyImages.length === 0) {
      toast({
        title: "Input Required",
        description: "Please enter a modification prompt or upload an image.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => {
        if (scene.id === sceneId) {
          return {
            ...scene,
            keyframes: scene.keyframes.map(keyframe => {
              if (keyframe.id === keyframeId) {
                let newImage = keyframe.image;
                let newVideo = keyframe.video;
                let newStyle = 'realistic';

                if (modifyImages.length > 0) {
                  if (keyframe.type === 'keyframe') {
                    newImage = modifyImages[0];
                  } else {
                    newVideo = modifyImages[0];
                  }
                  newStyle = 'uploaded';
                } else {
                  // For demo, choose style based on prompt keywords
                  if (modifyPrompt.toLowerCase().includes('night') || modifyPrompt.toLowerCase().includes('dark')) {
                    newStyle = 'cinematic';
                  } else if (modifyPrompt.toLowerCase().includes('art') || modifyPrompt.toLowerCase().includes('paint')) {
                    newStyle = 'artistic';
                  } else {
                    const styles = Object.keys(IMAGE_PRESETS);
                    newStyle = styles[Math.floor(Math.random() * styles.length)];
                  }
                  if (keyframe.type === 'keyframe') {
                    newImage = IMAGE_PRESETS[newStyle][sceneId] || keyframe.image;
                  } else {
                    newVideo = "https://www.w3schools.com/html/mov_bbb.mp4";
                  }
                }

                const newHistoryEntry = {
                  id: `keyframe_history_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  style: newStyle,
                  prompt: modifyPrompt || null
                };
                if (keyframe.type === 'keyframe') {
                  newHistoryEntry.image = newImage;
                } else {
                  newHistoryEntry.video = newVideo;
                }

                return {
                  ...keyframe,
                  image: newImage,
                  video: newVideo,
                  history: [newHistoryEntry, ...(keyframe.history || [])]
                };
              }
              return keyframe;
            })
          };
        }
        return scene;
      })
    };

    const updatedProject = { ...currentProject, animation: updatedAnimation };
    updateProject(updatedProject);
    setIsProcessing(false);
    setModifyPrompt('');
    setModifyImages([]);

    toast({
      title: "Frame Modified",
      description: modifyPrompt ? `Frame updated based on prompt: "${modifyPrompt}"` : "Frame updated with uploaded file",
    });
  };

  const handleUpscaleKeyframe = async (sceneId, keyframeId) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => {
        if (scene.id === sceneId) {
          return {
            ...scene,
            keyframes: scene.keyframes.map(keyframe => {
              if (keyframe.id === keyframeId) {
                const newHistoryEntry = {
                  id: `keyframe_history_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  style: 'upscaled',
                  prompt: null
                };
                if (keyframe.type === 'keyframe') {
                  newHistoryEntry.image = keyframe.image;
                } else {
                  newHistoryEntry.video = keyframe.video;
                }

                return {
                  ...keyframe,
                  history: [newHistoryEntry, ...(keyframe.history || [])]
                };
              }
              return keyframe;
            })
          };
        }
        return scene;
      })
    };

    const updatedProject = { ...currentProject, animation: updatedAnimation };
    updateProject(updatedProject);
    setIsProcessing(false);

    toast({
      title: "Frame Upscaled",
      description: "Frame has been upscaled.",
    });
  };

  const handleDeleteKeyframe = (sceneId, keyframeId) => {
    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => {
        if (scene.id === sceneId) {
          return {
            ...scene,
            keyframes: scene.keyframes.filter(k => k.id !== keyframeId)
          };
        }
        return scene;
      })
    };

    const updatedProject = { ...currentProject, animation: updatedAnimation };
    updateProject(updatedProject);
    setSelectedKeyframe(null);

    toast({
      title: "Frame Deleted",
      description: "The frame has been removed from the timeline.",
    });
  };

  const handleRevertKeyframeToVersion = (keyframeId, version) => {
    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => ({
        ...scene,
        keyframes: scene.keyframes.map(keyframe => {
          if (keyframe.id === keyframeId) {
            const updatedHistory = [version, ...keyframe.history.filter(h => h.id !== version.id)];

            return {
              ...keyframe,
              image: version.image || keyframe.image,
              video: version.video || keyframe.video,
              history: updatedHistory
            };
          }
          return keyframe;
        })
      }))
    };

    const updatedProject = { ...currentProject, animation: updatedAnimation };
    updateProject(updatedProject);
    setHistoryKeyframeId(null);

    toast({
      title: "Frame Version Restored",
      description: "Frame has been reverted to the selected version.",
    });
  };

  const handleInterpolate = (sceneId, keyframeIndex) => {
    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => {
        if (scene.id === sceneId) {
          const newKeyframes = [...scene.keyframes];
          const placeholderVideo = "https://www.w3schools.com/html/mov_bbb.mp4";
          newKeyframes.splice(keyframeIndex + 1, 0, {
            id: `interpolated_${Date.now()}`,
            type: 'interpolated',
            timestamp: (newKeyframes[keyframeIndex].timestamp + (newKeyframes[keyframeIndex + 1]?.timestamp || newKeyframes[keyframeIndex].timestamp + 2)) / 2,
            video: placeholderVideo,
            history: [{
              id: `keyframe_history_${Date.now()}`,
              video: placeholderVideo,
              timestamp: new Date().toISOString(),
              style: 'realistic',
              prompt: null
            }]
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

  const handleToggleMode = (sceneId, ezMode) => {
    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, ezMode } : scene
      )
    };
    const updatedProject = { ...currentProject, animation: updatedAnimation };
    updateProject(updatedProject);
  };

  const handleGoLive = (sceneId) => {
    setGoLiveSceneId(sceneId);
    setGoLivePrompt('');
  };

  const handleGenerateLive = async (sceneId) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const placeholderVideo = "https://www.w3schools.com/html/mov_bbb.mp4";

    const updatedAnimation = {
      ...currentProject.animation,
      scenes: currentProject.animation.scenes.map(scene => {
        if (scene.id === sceneId) {
          return {
            ...scene,
            keyframes: scene.keyframes.map((keyframe, index) => {
              if (index === 0) {
                const newHistoryEntry = {
                  id: `keyframe_history_${Date.now()}`,
                  video: placeholderVideo,
                  timestamp: new Date().toISOString(),
                  style: 'live',
                  prompt: goLivePrompt || null
                };
                return {
                  ...keyframe,
                  video: placeholderVideo,
                  history: [newHistoryEntry, ...(keyframe.history || [])]
                };
              }
              return keyframe;
            })
          };
        }
        return scene;
      })
    };

    const updatedProject = { ...currentProject, animation: updatedAnimation };
    updateProject(updatedProject);
    setIsProcessing(false);
    setGoLiveSceneId(null);
    setGoLivePrompt('');

    toast({
      title: "Scene Animated",
      description: "Keyframe animated based on prompt.",
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
          image: scene.image,
          history: [{
            id: `keyframe_initial_${scene.id}`,
            image: scene.image,
            timestamp: new Date().toISOString(),
            style: scene.style || 'realistic',
            prompt: null
          }]
        }],
        rendered: false,
        ezMode: true
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
  const currentKeyframe = selectedKeyframe ? 
    currentProject.animation?.scenes
      ?.find(s => s.id === selectedKeyframe.sceneId)
      ?.keyframes?.find(k => k.id === selectedKeyframe.keyframeId) : null;
  const historyKeyframe = historyKeyframeId ? 
    currentProject.animation?.scenes
      ?.flatMap(s => s.keyframes)
      ?.find(k => k.id === historyKeyframeId) : null;

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
              {hasAnimationScenes && currentProject.animation.scenes.map((scene, sceneIndex) => {
                const isEzMode = scene.ezMode !== false;
                return (
                <div key={scene.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Scene {sceneIndex + 1}</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <span>pro mod</span>
                        <Switch
                          checked={isEzMode}
                          onCheckedChange={(checked) => handleToggleMode(scene.id, checked)}
                        />
                        <span>ez mod</span>
                      </div>
                      {isEzMode ? (
                        <Button
                          size="sm"
                          onClick={() => handleGoLive(scene.id)}
                          className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Go Live
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddKeyframe(scene.id)}
                          className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Keyframe
                        </Button>
                      )}
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
                          <div
                            className={`relative group cursor-pointer ${
                              keyframe.type === 'keyframe'
                                ? 'bg-teal-500/20 border-teal-400/50'
                                : 'bg-purple-500/20 border-purple-400/50'
                            } ${
                              selectedKeyframe?.keyframeId === keyframe.id ? 'ring-2 ring-blue-400' : ''
                            } border rounded-lg p-3 min-w-[120px] transition-all hover:scale-105`}
                            onClick={() => handleSelectKeyframe(scene.id, keyframe.id)}
                          >
                            {keyframe.image && (
                              <img
                                src={keyframe.image}
                                alt={`Keyframe ${index + 1}`}
                                className="w-full h-16 object-cover rounded mb-2"
                              />
                            )}
                            {keyframe.video && (
                              <video
                                src={keyframe.video}
                                className="w-full h-16 object-cover rounded mb-2"
                                muted
                                loop
                              />
                            )}
                            <div className="text-xs text-center">
                              <div className={keyframe.type === 'keyframe' ? 'text-teal-300' : 'text-purple-300'}>
                                {keyframe.type === 'keyframe' ? 'Keyframe' : 'Interpolated'}
                              </div>
                              <div className="text-gray-400">{keyframe.timestamp}s</div>
                            </div>
                            {selectedKeyframe?.keyframeId === keyframe.id && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-400 rounded-full"></div>
                            )}
                          </div>

                          {index < scene.keyframes.length - 1 && !isEzMode && (
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

      {/* Go Live Modal */}
      <Dialog open={goLiveSceneId !== null} onOpenChange={(open) => { if (!open) { setGoLiveSceneId(null); setGoLivePrompt(''); } }}>
        <DialogContent className="bg-[#161616]/60 backdrop-blur-xl border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Go Live - Scene {goLiveSceneId ? currentProject.animation.scenes.findIndex(s => s.id === goLiveSceneId) + 1 : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={goLivePrompt}
              onChange={(e) => setGoLivePrompt(e.target.value)}
              placeholder="Enter animation prompt..."
              className="bg-white/5 border-white/20 text-white placeholder-gray-500"
            />
            <div className="flex justify-end space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setGoLiveSceneId(null); setGoLivePrompt(''); }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleGenerateLive(goLiveSceneId)}
                disabled={isProcessing}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
              >
                <Play className="h-4 w-4 mr-1" />
                Generate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Frame Editor Modal */}
      <Dialog open={!!selectedKeyframe} onOpenChange={(open) => { if (!open) { setSelectedKeyframe(null); setModifyPrompt(''); setImageResolution(''); } }}>
        <DialogContent className="bg-[#161616]/60 backdrop-blur-xl border-white/20 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Edit className="h-5 w-5 mr-2 text-blue-400" />
              Frame Editor - Scene {selectedKeyframe ? currentProject.animation.scenes.findIndex(s => s.id === selectedKeyframe.sceneId) + 1 : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedKeyframe && currentKeyframe && (
            <div className="space-y-4">
              {currentKeyframe.type === 'keyframe' ? (
                <img
                  src={currentKeyframe.image}
                  alt="Selected keyframe"
                  className="w-full h-64 object-cover rounded border border-blue-400/50"
                  onLoad={(e) => setImageResolution(`${e.target.naturalWidth}x${e.target.naturalHeight}`)}
                />
              ) : (
                <video
                  src={currentKeyframe.video}
                  controls
                  className="w-full h-64 object-cover rounded border border-blue-400/50"
                  onLoadedMetadata={(e) => setImageResolution(`${e.target.videoWidth}x${e.target.videoHeight}`)}
                />
              )}
              <div className="text-right text-sm text-gray-400">{imageResolution}</div>
              <div className="flex items-center space-x-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => setHistoryKeyframeId(selectedKeyframe.keyframeId)}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                >
                  <History className="h-3 w-3 mr-1" />
                  History
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUpscaleKeyframe(selectedKeyframe.sceneId, selectedKeyframe.keyframeId)}
                  disabled={isProcessing}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Upscale
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDeleteKeyframe(selectedKeyframe.sceneId, selectedKeyframe.keyframeId)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedKeyframe(null); setModifyPrompt(''); }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <div className="relative flex-1">
                  <Input
                    value={modifyPrompt}
                    onChange={(e) => setModifyPrompt(e.target.value)}
                    placeholder="Enter modification prompt..."
                    className="bg-white/5 border-white/20 text-white placeholder-gray-500 w-full pr-8"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleModifyKeyframeWithPrompt(selectedKeyframe.sceneId, selectedKeyframe.keyframeId);
                      }
                    }}
                  />
                  <label
                    htmlFor="modify-image-upload"
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-200"
                  >
                    <Paperclip className="h-4 w-4" />
                  </label>
                  <input
                    id="modify-image-upload"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleModifyImageUpload}
                    className="hidden"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => handleModifyKeyframeWithPrompt(selectedKeyframe.sceneId, selectedKeyframe.keyframeId)}
                  disabled={isProcessing}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                >
                  Apply
                </Button>
              </div>
              {modifyImages.length > 0 && (
                <div className="flex space-x-2 mt-2">
                  {modifyImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      {img.startsWith('data:video') ? (
                        <video
                          src={img}
                          className="h-12 w-12 object-cover rounded border border-white/20"
                        />
                      ) : (
                        <img
                          src={img}
                          alt={`preview-${idx}`}
                          className="h-12 w-12 object-cover rounded border border-white/20"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveModifyImage(idx)}
                        className="absolute -top-1 -right-1 bg-black/60 rounded-full p-0.5 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Keyframe Version History Modal */}
      <VersionHistoryModal
        isOpen={!!historyKeyframeId}
        onClose={() => setHistoryKeyframeId(null)}
        history={historyKeyframe?.history || []}
        onRevert={(version) => handleRevertKeyframeToVersion(historyKeyframeId, version)}
        title="Frame History"
      />
    </div>
  );
};

export default AnimationSection;
