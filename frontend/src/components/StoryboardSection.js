import React, { useState } from 'react';
import { Image as ImageIcon, Wand2, RefreshCw, Send, Download, History, ArrowUp, Edit, MessageSquare, Paperclip, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../hooks/use-toast';
import { IMAGE_PRESETS, IMAGE_STYLES } from '../mock';
import VersionHistoryModal from './VersionHistoryModal';

const StoryboardSection = ({ setActiveTab }) => {
  const { currentProject, updateProject } = useProject();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [modifyingSceneId, setModifyingSceneId] = useState(null);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [modifyImages, setModifyImages] = useState([]);
  const [historySceneId, setHistorySceneId] = useState(null);

  const handleGenerateImages = async () => {
    if (!currentProject.script.generated) {
      toast({
        title: "Нет сценария",
        description: "Сначала сгенерируйте сценарий, чтобы создать раскадровку.",
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
      generated: true,
      history: [{
        id: `${scene.id}_initial`,
        image: IMAGE_PRESETS[selectedStyle]?.[scene.id] || IMAGE_PRESETS.realistic[scene.id],
        timestamp: new Date().toISOString(),
        style: selectedStyle,
        prompt: null
      }]
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
      title: "Раскадровка создана",
      description: "Визуальные раскадровки созданы для всех сцен!",
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
        const newImage = IMAGE_PRESETS[nextStyle][sceneId];
        
        // Add to history
        const newHistoryEntry = {
          id: `${sceneId}_${Date.now()}`,
          image: newImage,
          timestamp: new Date().toISOString(),
          style: nextStyle,
          prompt: null
        };
        
        return {
          ...scene,
          image: newImage,
          style: nextStyle,
          history: [newHistoryEntry, ...(scene.history || [])]
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
      title: "Изображение обновлено",
      description: "Создан новый вариант!",
    });
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

  const handleModifyWithPrompt = async (sceneId) => {
    if (!modifyPrompt.trim() && modifyImages.length === 0) {
      toast({
        title: "Нужно заполнить поля",
        description: "Введите запрос на изменение или загрузите изображение.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const scenes = currentProject.storyboard.scenes.map(scene => {
      if (scene.id === sceneId) {
        let newStyle = scene.style;
        let newImage = scene.image;

        if (modifyImages.length > 0) {
          newImage = modifyImages[0];
          newStyle = 'uploaded';
        } else {
          // For demo, use a different preset based on prompt keywords
          if (modifyPrompt.toLowerCase().includes('night') || modifyPrompt.toLowerCase().includes('dark')) {
            newStyle = 'cinematic';
          } else if (modifyPrompt.toLowerCase().includes('art') || modifyPrompt.toLowerCase().includes('paint')) {
            newStyle = 'artistic';
          } else {
            const styles = Object.keys(IMAGE_PRESETS);
            const currentIndex = styles.indexOf(scene.style);
            newStyle = styles[(currentIndex + 1) % styles.length];
          }

          newImage = IMAGE_PRESETS[newStyle][sceneId];
        }

        const newHistoryEntry = {
          id: `${sceneId}_${Date.now()}`,
          image: newImage,
          timestamp: new Date().toISOString(),
          style: newStyle,
          prompt: modifyPrompt || null
        };

        return {
          ...scene,
          image: newImage,
          style: newStyle,
          history: [newHistoryEntry, ...(scene.history || [])]
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
    setModifyingSceneId(null);
    setModifyPrompt('');
    setModifyImages([]);

    toast({
      title: "Изображение изменено",
      description: modifyPrompt ? `Изображение обновлено по запросу: "${modifyPrompt}"` : "Изображение обновлено с загруженным изображением",
    });
  };

  const handleRevertToVersion = (sceneId, version) => {
    const scenes = currentProject.storyboard.scenes.map(scene => {
      if (scene.id === sceneId) {
        // Move the reverted version to the front of history
        const updatedHistory = [version, ...scene.history.filter(h => h.id !== version.id)];
        
        return {
          ...scene,
          image: version.image,
          style: version.style,
          history: updatedHistory
        };
      }
      return scene;
    });

    const updatedProject = {
      ...currentProject,
      storyboard: { ...currentProject.storyboard, scenes }
    };

    updateProject(updatedProject);
    setHistorySceneId(null);

    toast({
      title: "Версия восстановлена",
      description: "Изображение возвращено к выбранной версии.",
    });
  };

  const handleSendToAnimation = () => {
    if (!currentProject.storyboard.generated) {
      toast({
        title: "Раскадровка отсутствует",
        description: "Сначала сгенерируйте раскадровку.",
        variant: "destructive"
      });
      return;
    }

    // Auto-populate animation timeline
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
          style: scene.style,
          prompt: null
        }]
      }],
      rendered: false
    }));

    const updatedProject = {
      ...currentProject,
      animation: { scenes: animationScenes, rendered: false }
    };

    updateProject(updatedProject);

    toast({
      title: "Отправлено в анимацию",
      description: "Раскадровка отправлена в раздел анимации!",
    });
    setActiveTab('animation');
  };

  if (!currentProject) {
    return <div className="p-6 text-white">Проект не выбран</div>;
  }

  const hasStoryboard = currentProject.storyboard?.generated;
  const currentScene = currentProject.storyboard?.scenes?.find(s => s.id === historySceneId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Визуальная раскадровка</h1>
          <p className="text-gray-400">Создайте изображения для сцен анимации</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-teal-500/30 text-teal-300">
            {hasStoryboard ? 'Готово' : 'Не создано'}
          </Badge>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <History className="h-4 w-4 mr-2" />
            История
          </Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Download className="h-4 w-4 mr-2" />
            Экспорт
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
                Генерация изображений
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Стиль изображения</label>
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
                Сгенерировать изображения
              </Button>

              {!currentProject.script.generated && (
                <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  Сначала сгенерируйте сценарий, чтобы создать раскадровку
                </p>
              )}

              {isGenerating && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-2 text-teal-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
                    <span className="text-sm">Генерация изображений...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {hasStoryboard && (
            <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Сведения о раскадровке</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Изображения:</span>
                    <span className="text-white">{currentProject.storyboard.scenes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Стиль:</span>
                    <span className="text-white">{IMAGE_STYLES.find(s => s.value === selectedStyle)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Разрешение:</span>
                    <span className="text-white">800x450</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Storyboard Content */}
        <div className="lg:col-span-3">
          {hasStoryboard ? (
            <div className="space-y-6">
              {currentProject.storyboard.scenes.map((scene, index) => (
                <Card key={scene.id} className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">Сцена {index + 1}</CardTitle>
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
                          Сгенерировать ещё
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setModifyingSceneId(scene.id);
                            setModifyPrompt('');
                            setModifyImages([]);
                          }}
                          disabled={isGenerating}
                          className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Изменить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setHistorySceneId(scene.id)}
                          className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                        >
                          <History className="h-3 w-3 mr-1" />
                          История
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Повысить качество
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
                            alt={`Сцена ${index + 1}`}
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
                        <h4 className="text-sm font-medium text-white">Описание сцены</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{scene.content}</p>
                      </div>
                    </div>

                    {/* Modify Prompt/Image Input */}
                    {modifyingSceneId === scene.id && (
                      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-blue-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-300 text-sm font-medium">Измените по запросу или изображению</span>
                        </div>
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <Input
                              value={modifyPrompt}
                              onChange={(e) => setModifyPrompt(e.target.value)}
                              placeholder="например: сделать ночную сцену, убрать фон..."
                              className="bg-white/5 border-white/20 text-white placeholder-gray-500 w-full pr-8"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleModifyWithPrompt(scene.id);
                                }
                              }}
                            />
                            <label
                              htmlFor={`modify-image-upload-${scene.id}`}
                              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-200"
                            >
                              <Paperclip className="h-4 w-4" />
                            </label>
                            <input
                              id={`modify-image-upload-${scene.id}`}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleModifyImageUpload}
                              className="hidden"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleModifyWithPrompt(scene.id)}
                            disabled={isGenerating}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                          >
                            Применить
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setModifyingSceneId(null);
                              setModifyPrompt('');
                              setModifyImages([]);
                            }}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            Отмена
                          </Button>
                        </div>
                        {modifyImages.length > 0 && (
                          <div className="flex space-x-2 mt-2">
                            {modifyImages.map((img, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={img}
                                  alt={`предпросмотр-${idx}`}
                                  className="h-12 w-12 object-cover rounded border border-white/20"
                                />
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
                  </CardContent>
                </Card>
              ))}

              {/* Передать в анимацию */}
              <Card className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border-teal-400/30 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Раскадровка готова!</h3>
                    <p className="text-gray-300 mb-4">Готовы оживить сцены?</p>
                    <Button 
                      onClick={handleSendToAnimation}
                      className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white border-0"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Передать в анимацию
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10 h-96 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Раскадровка не создана</h3>
                <p className="text-gray-400 mb-4">Создайте изображения для сцен сценария</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={!!historySceneId}
        onClose={() => setHistorySceneId(null)}
        history={currentScene?.history || []}
        onRevert={(version) => handleRevertToVersion(historySceneId, version)}
        title={`История сцены ${currentProject.storyboard?.scenes?.findIndex(s => s.id === historySceneId) + 1 || ''}`}
      />
    </div>
  );
};

export default StoryboardSection;