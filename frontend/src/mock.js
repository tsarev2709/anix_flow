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
    scene1: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=450&fit=crop",
    scene2: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&h=450&fit=crop",
    scene3: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=450&fit=crop",
    scene4: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&h=450&fit=crop"
  },
  cinematic: {
    scene1: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=450&fit=crop",
    scene2: "https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=800&h=450&fit=crop",
    scene3: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=450&fit=crop",
    scene4: "https://images.unsplash.com/photo-1518843025960-d60217f226f5?w=800&h=450&fit=crop"
  },
  artistic: {
    scene1: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=450&fit=crop",
    scene2: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&h=450&fit=crop",
    scene3: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=450&fit=crop",
    scene4: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop"
  },
  futuristic: {
    scene1: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=450&fit=crop",
    scene2: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=450&fit=crop",
    scene3: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=450&fit=crop",
    scene4: "https://images.unsplash.com/photo-1446776899648-aa785fcac9cb?w=800&h=450&fit=crop"
  },
  vintage: {
    scene1: "https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=800&h=450&fit=crop",
    scene2: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&h=450&fit=crop",
    scene3: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&h=450&fit=crop",
    scene4: "https://images.unsplash.com/photo-1505855796860-aa05646cbf1f?w=800&h=450&fit=crop"
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
  { value: "friendly", label: "Душевный ИИ-наставник" },
  { value: "dramatic", label: "Мастер драматичных историй" },
  { value: "professional", label: "Эпичный голос за кадром" },
  { value: "robotic", label: "Кибернетический тембр" }
];

export const IMAGE_STYLES = [
  { value: "realistic", label: "Киношный реализм" },
  { value: "cinematic", label: "Лента блокбастера" },
  { value: "artistic", label: "Живая акварель" },
  { value: "anime", label: "Манга-вдохновение" }
];

export const VOICE_CHARACTERS = [
  { value: "friendly", label: "ИИ-компаньон" },
  { value: "dramatic", label: "Голос для эпопеи" },
  { value: "robotic", label: "Цифровой дискурс" }
];

export const MUSIC_GENRES = [
  { value: "ambient", label: "Атмосферные волны" },
  { value: "electronic", label: "Синти-биты" },
  { value: "cinematic", label: "Оркестровая мощь" }
];

export const SAMPLE_PROJECTS = [
  {
    id: "project1",
    name: "Производство бипок",
    lastModified: "2024-01-15T10:30:00Z",
    status: "Completed",
    thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=450&fit=crop"
  },
  {
    id: "project2", 
    name: "ЛСД",
    lastModified: "2024-01-14T16:45:00Z",
    status: "In Progress",
    thumbnail: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=450&fit=crop"
  },
  {
    id: "project3",
    name: "Кавказ",
    lastModified: "2024-01-12T09:15:00Z", 
    status: "Draft",
    thumbnail: "https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=800&h=450&fit=crop"
  }
];