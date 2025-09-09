import React, { useState } from 'react';
import { Volume2, Mic, Music, Zap, Play, Pause, Download, Send, MessageSquare, GripHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../hooks/use-toast';
import { AUDIO_PRESETS, VOICE_CHARACTERS, MUSIC_GENRES } from '../mock';

const SoundSection = () => {
  const { currentProject, updateProject } = useProject();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('friendly');
  const [selectedGenre, setSelectedGenre] = useState('ambient');
  const [voiceVolume, setVoiceVolume] = useState([80]);
  const [musicVolume, setMusicVolume] = useState([60]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState('');
  const [musicPrompt, setMusicPrompt] = useState('');
  const [draggedClip, setDraggedClip] = useState(null);

  const handleGenerateVoiceover = async () => {
    if (!currentProject.script?.generated) {
      toast({
        title: "No Script Available",
        description: "Generate a script first to create voiceovers.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const voiceoverTracks = currentProject.script.scenes.map((scene, index) => ({
      id: `vo_${scene.id}`,
      type: 'voiceover',
      sceneId: scene.id,
      name: `Voiceover ${index + 1}`,
      audioUrl: AUDIO_PRESETS.voiceover[selectedVoice],
      duration: scene.duration,
      volume: voiceVolume[0],
      character: selectedVoice,
      startTime: index * scene.duration, // Auto-position based on scene timing
      prompt: voicePrompt || null
    }));

    const updatedProject = {
      ...currentProject,
      sound: {
        ...currentProject.sound,
        voiceover: voiceoverTracks
      }
    };

    updateProject(updatedProject);
    setIsGenerating(false);
    setVoicePrompt('');

    toast({
      title: "Voiceover Generated",
      description: "AI voiceovers have been created for all scenes!",
    });
  };

  const handleGenerateMusic = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const musicTrack = {
      id: `music_${Date.now()}`,
      type: 'music',
      name: `Background Music - ${MUSIC_GENRES.find(g => g.value === selectedGenre)?.label}`,
      audioUrl: AUDIO_PRESETS.music[selectedGenre],
      duration: currentProject.script?.scenes?.reduce((sum, scene) => sum + scene.duration, 0) || 30,
      volume: musicVolume[0],
      genre: selectedGenre,
      startTime: 0, // Start from beginning
      prompt: musicPrompt || null
    };

    const updatedProject = {
      ...currentProject,
      sound: {
        ...currentProject.sound,
        music: [musicTrack]
      }
    };

    updateProject(updatedProject);
    setIsGenerating(false);
    setMusicPrompt('');

    toast({
      title: "Music Generated",
      description: "Background music has been created!",
    });
  };

  const handleFinalizeExport = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const updatedProject = {
      ...currentProject,
      sound: { ...currentProject.sound, finalized: true },
      status: 'Completed'
    };

    updateProject(updatedProject);
    setIsGenerating(false);

    toast({
      title: "Project Finalized!",
      description: "Your animation is complete and ready for export!",
    });
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would control video playback
  };

  const handleDragStart = (e, clip) => {
    setDraggedClip(clip);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, trackType) => {
    e.preventDefault();
    
    if (!draggedClip) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const trackWidth = rect.width;
    const totalDuration = currentProject.script?.scenes?.reduce((sum, scene) => sum + scene.duration, 0) || 30;
    const newStartTime = Math.max(0, (x / trackWidth) * totalDuration);

    const updatedProject = { ...currentProject };
    
    if (trackType === 'voiceover' && draggedClip.type === 'voiceover') {
      updatedProject.sound.voiceover = updatedProject.sound.voiceover.map(track => 
        track.id === draggedClip.id ? { ...track, startTime: newStartTime } : track
      );
    } else if (trackType === 'music' && draggedClip.type === 'music') {
      updatedProject.sound.music = updatedProject.sound.music.map(track => 
        track.id === draggedClip.id ? { ...track, startTime: newStartTime } : track
      );
    }

    updateProject(updatedProject);
    setDraggedClip(null);

    toast({
      title: "Audio Clip Moved",
      description: `${draggedClip.name} repositioned to ${Math.round(newStartTime)}s`,
    });
  };

  const calculateClipPosition = (startTime, duration, totalDuration) => {
    const left = (startTime / totalDuration) * 100;
    const width = Math.min((duration / totalDuration) * 100, 100 - left);
    return { left: `${left}%`, width: `${width}%` };
  };

  if (!currentProject) {
    return <div className="p-6 text-white">No project selected</div>;
  }

  const hasAnimation = currentProject.animation?.rendered;
  const hasVoiceover = currentProject.sound?.voiceover?.length > 0;
  const hasMusic = currentProject.sound?.music?.length > 0;
  const totalDuration = currentProject.script?.scenes?.reduce((sum, scene) => sum + scene.duration, 0) || 30;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Sound Design</h1>
          <p className="text-gray-400">Add voiceovers, music, and sound effects</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-teal-500/30 text-teal-300">
            {currentProject.sound?.finalized ? 'Finalized' : 'In Progress'}
          </Badge>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Download className="h-4 w-4 mr-2" />
            Export Audio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Preview */}
        <div className="lg:col-span-2">
          <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Play className="h-5 w-5 mr-2 text-teal-400" />
                Video Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasAnimation ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-16 w-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="h-8 w-8 text-teal-400" />
                        </div>
                        <p className="text-white text-lg mb-2">Animation Preview</p>
                        <p className="text-gray-400">Click play to preview with sound</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={togglePlayback}
                      className="bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Volume2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Animation Available</h3>
                    <p className="text-gray-400">Complete the animation first to add sound</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio Timeline */}
          <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Audio Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voiceover Track */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mic className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm">Voiceover</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-3 w-3 text-gray-400" />
                    <Slider
                      value={voiceVolume}
                      onValueChange={setVoiceVolume}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                    <span className="text-xs text-gray-400 w-8">{voiceVolume[0]}%</span>
                  </div>
                </div>
                <div 
                  className="relative h-12 bg-white/5 rounded border border-white/10 overflow-hidden"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'voiceover')}
                >
                  {hasVoiceover ? (
                    currentProject.sound.voiceover.map((track, index) => {
                      const position = calculateClipPosition(track.startTime, track.duration, totalDuration);
                      return (
                        <div
                          key={track.id}
                          className="absolute h-8 bg-blue-500/30 rounded border border-blue-400/50 flex items-center justify-center cursor-move top-2 group hover:bg-blue-500/40 transition-colors"
                          style={position}
                          draggable
                          onDragStart={(e) => handleDragStart(e, track)}
                        >
                          <GripHorizontal className="h-3 w-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity mr-1" />
                          <span className="text-xs text-blue-300 truncate">VO {index + 1}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-500 text-xs">No voiceover tracks - drop here to position</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Music Track */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Music className="h-4 w-4 text-green-400" />
                    <span className="text-white text-sm">Music</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-3 w-3 text-gray-400" />
                    <Slider
                      value={musicVolume}
                      onValueChange={setMusicVolume}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                    <span className="text-xs text-gray-400 w-8">{musicVolume[0]}%</span>
                  </div>
                </div>
                <div 
                  className="relative h-12 bg-white/5 rounded border border-white/10 overflow-hidden"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'music')}
                >
                  {hasMusic ? (
                    currentProject.sound.music.map((track) => {
                      const position = calculateClipPosition(track.startTime, track.duration, totalDuration);
                      return (
                        <div
                          key={track.id}
                          className="absolute h-8 bg-green-500/30 rounded border border-green-400/50 flex items-center justify-center cursor-move top-2 group hover:bg-green-500/40 transition-colors"
                          style={position}
                          draggable
                          onDragStart={(e) => handleDragStart(e, track)}
                        >
                          <GripHorizontal className="h-3 w-3 text-green-300 opacity-0 group-hover:opacity-100 transition-opacity mr-1" />
                          <span className="text-xs text-green-300 truncate">{track.genre}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-500 text-xs">No music tracks - drop here to position</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SFX Track */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-white text-sm">Sound Effects</span>
                </div>
                <div className="h-12 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">coming soon...</span>
                </div>
              </div>

              {/* Timeline Ruler */}
              <div className="relative h-6 bg-white/5 rounded border border-white/10 mt-4">
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }, (_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="h-1 w-px bg-gray-400"></div>
                      <span className="text-xs text-gray-400 mt-1">{i * 5}s</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sound Controls */}
        <div className="space-y-4">
          {/* Voiceover Generation */}
          <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Mic className="h-5 w-5 mr-2 text-blue-400" />
                Voiceover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Voice Character</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-white/20">
                    {VOICE_CHARACTERS.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value} className="text-white focus:bg-white/10">
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Voice Generation Prompt
                </label>
                <Input
                  value={voicePrompt}
                  onChange={(e) => setVoicePrompt(e.target.value)}
                  placeholder="e.g., energetic and friendly tone..."
                  className="bg-white/5 border-white/20 text-white placeholder-gray-500"
                />
              </div>

              <Button 
                onClick={handleGenerateVoiceover}
                disabled={isGenerating || !currentProject.script?.generated}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
              >
                <Mic className="h-4 w-4 mr-2" />
                Generate Voice-over
              </Button>

              {hasVoiceover && (
                <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">
                  ✓ {currentProject.sound.voiceover.length} voiceover tracks generated
                  <br />
                  <span className="text-gray-400">Drag clips in timeline to reposition</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Music Generation */}
          <Card className="bg-[#161616]/60 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Music className="h-5 w-5 mr-2 text-green-400" />
                Background Music
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Music Genre</label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-white/20">
                    {MUSIC_GENRES.map((genre) => (
                      <SelectItem key={genre.value} value={genre.value} className="text-white focus:bg-white/10">
                        {genre.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Music Generation Prompt
                </label>
                <Input
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="e.g., epic orchestral, upbeat synthwave..."
                  className="bg-white/5 border-white/20 text-white placeholder-gray-500"
                />
              </div>

              <Button 
                onClick={handleGenerateMusic}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
              >
                <Music className="h-4 w-4 mr-2" />
                Generate Music
              </Button>

              {hasMusic && (
                <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">
                  ✓ Background music generated
                  <br />
                  <span className="text-gray-400">Drag clips in timeline to reposition</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export */}
          <Card className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border-teal-400/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-white">Ready to Export?</h3>
                <p className="text-gray-300 text-sm">Finalize your animation with all audio tracks</p>
                
                <Button 
                  onClick={handleFinalizeExport}
                  disabled={isGenerating || (!hasVoiceover && !hasMusic)}
                  className="w-full bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white border-0"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Finalize & Export
                </Button>

                {isGenerating && (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center space-x-2 text-teal-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
                      <span className="text-sm">Processing final export...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SoundSection;