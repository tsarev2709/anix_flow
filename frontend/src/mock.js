// Mock data for AnimAI Pro

export const SCRIPT_PRESETS = {
  primary: {
    title: "The Robot's First Day",
    narrator: "Friendly AI Narrator",
    scenes: [
      {
        id: "scene1",
        content: "A curious robot powers on its optics for the first time in a dusty lab. Servos whir softly as blue lights flicker to life behind transparent sensors.",
        duration: 8
      },
      {
        id: "scene2", 
        content: "The robot takes its first wobbly step, knocking over a beaker. Glass shatters as colorful chemicals spill across the floor in a mesmerizing cascade.",
        duration: 6
      },
      {
        id: "scene3",
        content: "A cat observes the robot from a high shelf, its tail twitching with curiosity. Golden eyes track every mechanical movement with feline intensity.",
        duration: 7
      },
      {
        id: "scene4",
        content: "The robot and the cat stare at each other, a spark of friendship igniting. Two different forms of intelligence meeting for the first time.",
        duration: 9
      }
    ]
  },
  alternate: {
    title: "Digital Dreams",
    narrator: "Dramatic Storyteller",
    scenes: [
      {
        id: "scene1",
        content: "In a neon-lit laboratory, an AI awakens to consciousness. Circuit patterns pulse with electric dreams.",
        duration: 10
      },
      {
        id: "scene2",
        content: "The AI's first attempt at movement sends sparks flying. Technology and chaos dance together.",
        duration: 8
      },
      {
        id: "scene3", 
        content: "A wise old cat watches from the shadows, having seen many experiments before.",
        duration: 6
      },
      {
        id: "scene4",
        content: "Two souls connect across the divide of biology and technology.",
        duration: 12
      }
    ]
  }
};

export const IMAGE_PRESETS = {
  realistic: {
    scene1: "https://picsum.photos/seed/robot-lab-01/800/450",
    scene2: "https://picsum.photos/seed/robot-step-01/800/450", 
    scene3: "https://picsum.photos/seed/cat-shelf-01/800/450",
    scene4: "https://picsum.photos/seed/robot-cat-01/800/450"
  },
  cinematic: {
    scene1: "https://picsum.photos/seed/robot-lab-cinema/800/450",
    scene2: "https://picsum.photos/seed/robot-step-cinema/800/450",
    scene3: "https://picsum.photos/seed/cat-shelf-cinema/800/450", 
    scene4: "https://picsum.photos/seed/robot-cat-cinema/800/450"
  },
  artistic: {
    scene1: "https://picsum.photos/seed/robot-lab-art/800/450",
    scene2: "https://picsum.photos/seed/robot-step-art/800/450",
    scene3: "https://picsum.photos/seed/cat-shelf-art/800/450",
    scene4: "https://picsum.photos/seed/robot-cat-art/800/450"
  }
};

export const AUDIO_PRESETS = {
  voiceover: {
    friendly: "https://www.soundjay.com/misc/sounds/beep-07.wav",
    dramatic: "https://www.soundjay.com/misc/sounds/beep-10.wav",
    robotic: "https://www.soundjay.com/misc/sounds/beep-28.wav"
  },
  music: {
    ambient: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    electronic: "https://www.soundjay.com/misc/sounds/bell-ringing-02.wav", 
    cinematic: "https://www.soundjay.com/misc/sounds/bell-ringing-01.wav"
  },
  sfx: {
    robotMovement: "https://www.soundjay.com/misc/sounds/beep-03.wav",
    glassBreak: "https://www.soundjay.com/misc/sounds/beep-05.wav",
    catPurr: "https://www.soundjay.com/misc/sounds/beep-02.wav"
  }
};

export const NARRATOR_OPTIONS = [
  { value: "friendly", label: "Friendly AI Narrator" },
  { value: "dramatic", label: "Dramatic Storyteller" },
  { value: "professional", label: "Professional Narrator" },
  { value: "robotic", label: "Robotic Voice" }
];

export const IMAGE_STYLES = [
  { value: "realistic", label: "Photorealistic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "artistic", label: "Artistic Style" },
  { value: "anime", label: "Anime Style" }
];

export const VOICE_CHARACTERS = [
  { value: "friendly", label: "Friendly AI" },
  { value: "dramatic", label: "Dramatic Voice" },
  { value: "robotic", label: "Robotic Tone" }
];

export const MUSIC_GENRES = [
  { value: "ambient", label: "Ambient" },
  { value: "electronic", label: "Electronic" },
  { value: "cinematic", label: "Cinematic" }
];

export const SAMPLE_PROJECTS = [
  {
    id: "project1",
    name: "The Robot's First Day",
    lastModified: "2024-01-15T10:30:00Z",
    status: "Completed",
    thumbnail: "https://picsum.photos/seed/project1/300/200"
  },
  {
    id: "project2", 
    name: "Digital Dreams",
    lastModified: "2024-01-14T16:45:00Z",
    status: "In Progress",
    thumbnail: "https://picsum.photos/seed/project2/300/200"
  },
  {
    id: "project3",
    name: "AI Awakening",
    lastModified: "2024-01-12T09:15:00Z", 
    status: "Draft",
    thumbnail: "https://picsum.photos/seed/project3/300/200"
  }
];