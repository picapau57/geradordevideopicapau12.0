export interface Scene {
  text: string;
  imagePrompt: string;
  imgUrl?: string;
  img?: HTMLImageElement | null;
  imgLoaded: boolean;
  audioBlob?: Blob | null;
  audioDuration: number;
  audioMethod?: string;
  wordsCount: number;
  error: boolean;
  kenBurnsMode: number;
  transitionType: string;
}

export interface Story {
  title: string;
  styleSuggestion: string;
  scenes: Scene[];
}

export interface ThemeConfig {
  name: string;
  icon: string;
  kw: string;
  sfx: string;
}

export interface StyleConfig {
  name: string;
  icon: string;
  promptAdd: string;
}

export interface VoiceConfig {
  id: string;
  name: string;
  gender: string;
  desc: string;
}
