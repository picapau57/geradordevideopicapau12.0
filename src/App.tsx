import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Film, Sliders, Volume2, Tv, Smartphone, Play, Square, 
  Download, RefreshCw, Music, Plus, Trash2, Settings, Check, 
  ExternalLink, AlertTriangle, Terminal, Eye, Languages, Wand2, Pause
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Scene, Story, ThemeConfig, StyleConfig, VoiceConfig } from "./types";

// Static Configuration constants
const THEMES: Record<string, ThemeConfig> = {
  forest: { name: "Floresta", icon: "🌲", kw: "amazon rainforest, lush jungle, sunbeams, detailed foliage", sfx: "birds" },
  space: { name: "Espaço", icon: "🚀", kw: "outer space, stars, nebulas, cosmic dust, deep universe", sfx: "wind" },
  ocean: { name: "Oceano", icon: "🌊", kw: "deep ocean underwater, coral reefs, sunrays filtering through water", sfx: "water" },
  sunset: { name: "Pôr do Sol", icon: "🌅", kw: "gorgeous dramatic sunset, golden hour lighting, orange and purple sky", sfx: "wind" },
  neon: { name: "Neon/Futurista", icon: "🌆", kw: "cyberpunk futuristic cityscape, glowing neon lights, rain-slicked streets", sfx: "rain" },
  fire: { name: "Fogo", icon: "🔥", kw: "dramatic volcanic landscape, molten lava flowing, warm amber embers", sfx: "fire" },
  medieval: { name: "Medieval", icon: "⚔️", kw: "ancient medieval stone castle fortress, dramatic morning fog", sfx: "wind" },
  desert: { name: "Deserto", icon: "🏜️", kw: "vast desert sand dunes, blazing sun, heat haze distortion", sfx: "wind" }
};

const STYLES: Record<string, StyleConfig> = {
  cinematic: { name: "Cinemático", icon: "🎬", promptAdd: "cinematic masterpiece, realistic lighting, 8k resolution, highly detailed, dramatic composition" },
  cartoon: { name: "Pixar Cartoon", icon: "🎨", promptAdd: "cute disney pixar style 3d cartoon illustration, rich textures, vibrant warm colors" },
  anime: { name: "Anime Studio", icon: "🌸", promptAdd: "beautiful hand-drawn pastel anime illustration, studio ghibli aesthetic, soft details" },
  oil: { name: "Pintura a Óleo", icon: "🖌️", promptAdd: "classic thick oil painting texture, visible brush strokes, rich fine art style" },
  watercolor: { name: "Aquarela", icon: "💧", promptAdd: "ethereal soft watercolor painting, elegant fluid colors, artistic wash" },
  pixel: { name: "Pixel Art", icon: "👾", promptAdd: "retro 16-bit pixel art style, detailed pixel grids, retro game illustration" },
  comic: { name: "Quadrinhos/Comic", icon: "💥", promptAdd: "vibrant vintage comic book illustration, clean ink outlines, retro shading dots" },
  "3d": { name: "Render 3D", icon: "🧊", promptAdd: "polished digital 3d clay render, soft ambient occlusion, cute toy look" }
};

const VOICES: VoiceConfig[] = [
  { id: "nova", name: "Nova", gender: "Feminina", desc: "Clara, energética e expressiva" },
  { id: "shimmer", name: "Shimmer", gender: "Feminina", desc: "Suave, calma e acolhedora" },
  { id: "alloy", name: "Alloy", gender: "Neutra", desc: "Equilibrada, profissional e limpa" },
  { id: "echo", name: "Echo", gender: "Masculina", desc: "Firme, confiável e ponderada" },
  { id: "fable", name: "Fable", gender: "Neutra", desc: "Narrativa, misteriosa e artística" },
  { id: "onyx", name: "Onyx", gender: "Masculina", desc: "Grave, profunda e autoritária" },
  { id: "ash", name: "Ash", gender: "Masculina", desc: "Jovem, amigável e casual" },
  { id: "coral", name: "Coral", gender: "Feminina", desc: "Jovem, animada e calorosa" },
  { id: "sage", name: "Sage", gender: "Neutra", desc: "Sussurrada, calorosa e intimista" }
];

export default function App() {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<"script" | "custom" | "timings">("script");
  
  // Custom Story State (manually input or generated)
  const [storyTitle, setStoryTitle] = useState("Aventura do Pica-Pau");
  const [styleSuggestion, setStyleSuggestion] = useState("cinematic");
  const [scenes, setScenes] = useState<Scene[]>([]);
  
  // manual story input text
  const [manualText, setManualText] = useState("");
  
  // Gemini AI generation options
  const [topic, setTopic] = useState("Pica-pau aventureiro descobre um mapa secreto na floresta");
  const [extraInstructions, setExtraInstructions] = useState("Faça uma narrativa engraçada, rápida e cheia de suspense.");
  const [numCenas, setNumCenas] = useState(5);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  
  // Video Customization options
  const [format, setFormat] = useState<"16:9" | "9:16">("9:16");
  const [theme, setTheme] = useState("forest");
  const [style, setStyle] = useState("cinematic");
  const [ttsVoice, setTtsVoice] = useState("nova");
  const [emotion, setEmotion] = useState("");
  const [sfxType, setSfxType] = useState("auto");
  const [musicType, setMusicType] = useState("ambient");
  
  // Volumes
  const [volVoice, setVolVoice] = useState(100);
  const [volMusic, setVolMusic] = useState(25);
  const [volSfx, setVolSfx] = useState(35);
  
  // Timings and subtitle settings
  const [seed, setSeed] = useState(42);
  const [minDuration, setMinDuration] = useState(35); // in seconds
  const [pauseBetween, setPauseBetween] = useState(1.5); // seconds
  const [transitionDuration, setTransitionDuration] = useState(0.7); // seconds
  const [karaoke, setKaraoke] = useState(true);
  const [transitionType, setTransitionType] = useState("auto"); // auto, fade, slide, wipe, zoom
  
  // Compilation & preview state
  const [compiling, setCompiling] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [logs, setLogs] = useState<{ id: string; time: string; text: string; type: "info" | "ok" | "warn" | "err" }[]>([]);
  const [statusText, setStatusText] = useState("Pronto para iniciar! ✨");
  const [assetsGenerated, setAssetsGenerated] = useState(false);
  
  // Download URLs
  const [compiledVideoUrl, setCompiledVideoUrl] = useState<string | null>(null);
  const [compiledAudioUrl, setCompiledAudioUrl] = useState<string | null>(null);
  const [videoBlobSize, setVideoBlobSize] = useState(0);
  const [audioBlobSize, setAudioBlobSize] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const [finalVoicesCount, setFinalVoicesCount] = useState(0);
  
  // Sync playback state
  const [isPlayingSync, setIsPlayingSync] = useState(false);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const cancelCompilationRef = useRef(false);

  // Initial load: populate with default story
  useEffect(() => {
    const defaultStoryText = `Era uma vez um pica-pau chamado Zé que vivia nas profundezas da floresta amazônica, entre árvores centenárias e rios de águas brilhantes.\n\nTodos os dias ao amanhecer, Zé acordava animado e saía bicando as cascas em busca de deliciosos insetos e frutas coloridas.\n\nCerta manhã, enquanto trabalhava em um tronco antigo, encontrou um pedaço de papel enrolado: um misterioso mapa do tesouro!\n\nSem pensar duas vezes, chamou sua amiga Arara e partiram numa jornada cheia de mistérios e risadas pela selva.\n\nNo final, descobriram que o verdadeiro tesouro não era ouro, mas sim as aventuras vividas e os laços eternos de amizade.`;
    setManualText(defaultStoryText);
    parseManualStory(defaultStoryText);
  }, []);

  // Sync canvas dimensions when format changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = format === "16:9" ? 1280 : 720;
      canvas.height = format === "16:9" ? 720 : 1280;
      drawIdlePlaceholder();
    }
  }, [format]);

  // Append a console log
  const log = (text: string, type: "info" | "ok" | "warn" | "err" = "info") => {
    const time = new Date().toLocaleTimeString();
    const id = Math.random().toString(36).substring(2, 9);
    setLogs(prev => [...prev, { id, time, text, type }]);
    
    // Auto scroll log terminal
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  const drawIdlePlaceholder = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const isMobile = W < H;

    // Beautiful professional background gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0F1115");
    g.addColorStop(0.5, "#0A0C10");
    g.addColorStop(1, "#050505");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Decorative stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    for (let i = 0; i < 60; i++) {
      const x = (Math.sin(i * 382.2) * 0.5 + 0.5) * W;
      const y = (Math.cos(i * 123.9) * 0.5 + 0.5) * H;
      const r = (Math.sin(i * 4.4) * 0.5 + 0.5) * 1.8 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Centered Title Text
    const titleSize = isMobile ? 38 : 52;
    ctx.font = `bold ${titleSize}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#3b82f6";
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 12;
    ctx.fillText("🪶 PICA-PAU v12.0", W / 2, H / 2 - 40);

    // Centered Subtitle
    ctx.shadowBlur = 0;
    const subtitleSize = isMobile ? 18 : 24;
    ctx.font = `500 ${subtitleSize}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    
    if (isMobile) {
      // Wrap subtitle for vertical format
      ctx.fillText("Insira ou gere sua história", W / 2, H / 2 + 15);
      ctx.fillText("e clique em Gerar Vídeo", W / 2, H / 2 + 45);
    } else {
      ctx.fillText("Insira ou gere sua história e clique em Gerar Vídeo", W / 2, H / 2 + 25);
    }

    // Bottom brand tag
    const bottomSize = isMobile ? 12 : 18;
    ctx.font = `bold ${bottomSize}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText("POLLINATIONS AI ENGINE • CLIENT-SIDE PIPELINE", W / 2, H - 40);
  };

  // Parse custom raw story text into individual scenes
  const parseManualStory = (text: string) => {
    if (!text.trim()) return;
    
    // Split by double enters to find paragraph blocks
    let sceneTexts = text
      .split(/\n\n+/)
      .map(t => t.trim())
      .filter(Boolean);

    // Fallback if not enough paragraphs: split by punctuation
    if (sceneTexts.length < 3) {
      const sentenceRegex = /(?<=[.!?])\s+/;
      const sentences = text.split(sentenceRegex).filter(Boolean);
      const grouped: string[] = [];
      let temp = "";
      for (const s of sentences) {
        if ((temp + " " + s).length > 150 && temp) {
          grouped.push(temp.trim());
          temp = s;
        } else {
          temp = temp ? temp + " " + s : s;
        }
      }
      if (temp) grouped.push(temp.trim());
      sceneTexts = grouped;
    }

    // Build standard scene representations
    const mappedScenes: Scene[] = sceneTexts.slice(0, 10).map((t, idx) => {
      // Create a visual translation/style-prompt based on the theme and style
      const themeConfig = THEMES[theme] || THEMES.forest;
      const styleConfig = STYLES[style] || STYLES.cinematic;
      const visualPrompt = `${t}, detailed character, ${themeConfig.kw}, ${styleConfig.promptAdd}`;

      return {
        text: t,
        imagePrompt: visualPrompt,
        imgLoaded: false,
        img: null,
        audioDuration: 0,
        wordsCount: t.split(/\s+/).length,
        error: false,
        kenBurnsMode: Math.floor(Math.random() * 4),
        transitionType: transitionType === "auto" ? ["fade", "slide", "wipe", "zoom"][Math.floor(Math.random() * 4)] : transitionType
      };
    });

    setScenes(mappedScenes);
    setAssetsGenerated(false);
  };

  // Generate full story using server-side Gemini AI route
  const generateStoryWithGemini = async () => {
    if (!topic.trim()) {
      alert("Escreva um tema ou assunto para a história!");
      return;
    }
    
    setIsGeneratingStory(true);
    log(`🔮 Solicitando ao Gemini AI para criar o roteiro sobre: "${topic}"...`, "info");
    
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          prompt: extraInstructions,
          count: numCenas
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json() as Story;
      log(`✅ Roteiro gerado com sucesso pelo Gemini: "${data.title}"`, "ok");
      
      setStoryTitle(data.title);
      if (data.styleSuggestion) {
        // Try matching returned style suggestion to our configs
        const matched = Object.keys(STYLES).find(k => k.toLowerCase().includes(data.styleSuggestion.toLowerCase()) || data.styleSuggestion.toLowerCase().includes(k));
        if (matched) {
          setStyle(matched);
        }
      }

      // Convert server format to our state layout
      const convertedScenes: Scene[] = data.scenes.map((s, idx) => ({
        text: s.text,
        imagePrompt: s.imagePrompt,
        imgLoaded: false,
        img: null,
        audioDuration: 0,
        wordsCount: s.text.split(/\s+/).length,
        error: false,
        kenBurnsMode: Math.floor(Math.random() * 4),
        transitionType: transitionType === "auto" ? ["fade", "slide", "wipe", "zoom"][Math.floor(Math.random() * 4)] : transitionType
      }));

      setScenes(convertedScenes);
      setAssetsGenerated(false);
      
      // Update the manual textarea so they can edit if wanted
      const fullStoryText = data.scenes.map(s => s.text).join("\n\n");
      setManualText(fullStoryText);

    } catch (err: any) {
      log(`❌ Erro de geração com Gemini: ${err.message}`, "err");
      alert(`Ocorreu um erro ao gerar roteiro via Gemini: ${err.message}`);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Preload a single image with crossOrigin to prevent canvas taint, proxying to bypass CORS with auto-retries and fallback
  const preloadImageWithProxy = async (url: string, retries = 3): Promise<HTMLImageElement> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const imgObj = new Image();
          imgObj.crossOrigin = "anonymous";
          imgObj.onload = () => resolve(imgObj);
          imgObj.onerror = () => reject(new Error("Erro ao carregar imagem via proxy"));
          imgObj.src = proxyUrl;
        });
        return img;
      } catch (err) {
        if (attempt === retries) {
          // Final fallback: try direct load without proxy
          try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const imgObj = new Image();
              imgObj.crossOrigin = "anonymous";
              imgObj.onload = () => resolve(imgObj);
              imgObj.onerror = () => reject(new Error("Carregamento direto falhou"));
              imgObj.src = url;
            });
            return img;
          } catch (directErr) {
            throw new Error(`Falha após ${retries} tentativas de proxy e carregamento direto.`);
          }
        }
        // Wait before retrying (exponential backoff)
        await new Promise(r => setTimeout(r, attempt * 1200));
      }
    }
    throw new Error("Erro desconhecido ao carregar imagem.");
  };

  // ============ TTS API CALL & JSON EXTRACTOR ============
  const generateTTS = async (text: string, voice: string, emo: string): Promise<{ blob: Blob; method: string }> => {
    // Tenta primeiro através do Proxy do Servidor (/api/tts) para evitar problemas de CORS no Render/Vercel
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, emo })
      });

      if (response.ok) {
        const responseBlob = await response.blob();
        const method = response.headers.get("X-TTS-Method") || "Proxy do Servidor (Sucesso)";
        return { blob: responseBlob, method };
      } else {
        const errorText = await response.text();
        console.warn(`[TTS Client] Proxy do servidor retornou erro ${response.status}: ${errorText}`);
      }
    } catch (err: any) {
      console.warn("[TTS Client] Falha ao conectar ao Proxy do Servidor. Tentando chamada client-side direta...", err);
    }

    const fullText = emo ? `${emo} ${text}` : text;
    
    // Método de Fallback Direto Client-Side 1: Try openai-audio via POST
    try {
      const response = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: fullText }],
          model: "openai-audio",
          voice: voice,
          response_modalities: ["audio"]
        })
      });

      if (response.ok) {
        const responseText = await response.text();
        const cleaned = responseText.trim();
        
        if (cleaned.startsWith("{")) {
          const parsed = JSON.parse(cleaned);
          const base64Audio = parsed.choices?.[0]?.message?.audio?.data || parsed.audio || parsed.choices?.[0]?.message?.content;
          
          if (base64Audio) {
            const binStr = window.atob(base64Audio);
            const bytes = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) {
              bytes[i] = binStr.charCodeAt(i);
            }
            const blob = new Blob([bytes.buffer], { type: "audio/mp3" });
            return { blob, method: "Pollinations POST Direto (Base64 JSON)" };
          }
        } else {
          const binaryBytes = new Uint8Array(responseText.length);
          for (let i = 0; i < responseText.length; i++) {
            binaryBytes[i] = responseText.charCodeAt(i);
          }
          const blob = new Blob([binaryBytes.buffer], { type: "audio/mp3" });
          return { blob, method: "Pollinations POST Direto (Raw Binary)" };
        }
      }
    } catch (err: any) {
      console.warn("Fallback client-side POST falhou:", err);
    }

    // Método de Fallback Direto Client-Side 2: GET fallback com model=openai
    try {
      const url = `https://text.pollinations.ai/${encodeURIComponent(fullText)}?model=openai&voice=${voice}`;
      const response = await fetch(url);
      if (response.ok) {
        const responseBlob = await response.blob();
        const textVal = await responseBlob.text();
        if (textVal.trim().startsWith("{")) {
          const parsed = JSON.parse(textVal);
          const base64Audio = parsed.choices?.[0]?.message?.audio?.data || parsed.audio;
          if (base64Audio) {
            const binStr = window.atob(base64Audio);
            const bytes = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) {
              bytes[i] = binStr.charCodeAt(i);
            }
            return { blob: new Blob([bytes.buffer], { type: "audio/mp3" }), method: "Pollinations GET Direto (Base64 JSON)" };
          }
        }
        return { blob: responseBlob, method: "Pollinations GET Direto (Raw Blob)" };
      }
    } catch (err: any) {
      throw new Error(`Ambos os métodos de TTS (Proxy e Chamada Direta) falharam. Erro final: ${err.message}`);
    }

    throw new Error("Não foi possível gerar a locução de voz.");
  };

  // Precise audio decoding and duration fetching using client-side AudioContext
  const getAudioDurationOfBlob = async (blob: Blob): Promise<number> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ab = await blob.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(ab);
      const d = decoded.duration;
      await audioContext.close();
      return isFinite(d) && d > 0 ? d : 5;
    } catch (e) {
      console.warn("Decode audio duration failed, using fallback 5s", e);
      return 5;
    }
  };

  // ============ ASSETS PIPELINE (GENERATE IMAGES & TTS) ============
  const generateAssetsOnly = async (): Promise<boolean> => {
    if (scenes.length === 0) {
      alert("Nenhum roteiro carregado! Digite ou gere uma história primeiro.");
      return false;
    }

    setCompiling(true);
    cancelCompilationRef.current = false;
    setCompilationProgress(5);
    setStatusText("🎨 Gerando artes e gravações de voz por IA...");
    log("🚀 Iniciando geração de mídias por inteligência artificial...", "info");

    const tk = theme;
    const sk = style;
    const voice = ttsVoice;
    const emo = emotion;

    // Reset scene states for compilation
    const updatedScenes = [...scenes];
    
    // 1. Generate Images in a controlled sequential manner to avoid API rate limits and gateway timeouts
    log("🖼️ Gerando ilustrações para as cenas de forma sequencial...", "info");
    let completeCount = 0;

    const generateImageForScene = async (i: number) => {
      if (cancelCompilationRef.current) return;
      try {
        const text = updatedScenes[i].text;
        const basePrompt = updatedScenes[i].imagePrompt;
        
        // Build perfect URL
        const verticalParam = format === "9:16" ? ", vertical, portrait orientation, mobile framing" : ", cinematic widescreen, landscape aspect ratio";
        const finalPrompt = `${basePrompt}${verticalParam}, masterpiece, high resolution, ultra detail`;
        
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${format === "9:16" ? 720 : 1280}&height=${format === "9:16" ? 1280 : 720}&seed=${seed + i}&nologo=true&enhance=true`;
        
        log(`🖼️ [Cena ${i + 1}/${scenes.length}] Solicitando imagem via Pollinations...`, "info");
        const loadedImg = await preloadImageWithProxy(imageUrl);
        
        updatedScenes[i].img = loadedImg;
        updatedScenes[i].imgUrl = imageUrl;
        updatedScenes[i].imgLoaded = true;
        completeCount++;
        
        log(`✅ [Cena ${i + 1}/${scenes.length}] Imagem carregada com sucesso!`, "ok");
        
        // Increment progress (max 35% for images)
        setCompilationProgress(5 + Math.floor((completeCount / scenes.length) * 35));
      } catch (err: any) {
        updatedScenes[i].error = true;
        log(`❌ [Cena ${i + 1}/${scenes.length}] Erro ao carregar imagem: ${err.message}`, "err");
      }
    };

    for (let i = 0; i < scenes.length; i++) {
      if (cancelCompilationRef.current) break;
      setStatusText(`🖼️ Gerando Imagem da Cena ${i + 1}/${scenes.length}...`);
      await generateImageForScene(i);
      // Wait slightly between requests to prevent concurrent spike
      await new Promise(r => setTimeout(r, 400));
    }

    if (cancelCompilationRef.current) {
      setCompiling(false);
      return false;
    }

    // 2. Generate Audio Narrations (Sequential to avoid API rate limits)
    log("🎙️ Solicitando locução das falas em sequência...", "info");
    let audioSuccess = 0;

    for (let i = 0; i < scenes.length; i++) {
      if (cancelCompilationRef.current) break;
      try {
        setStatusText(`🎙️ Narrando Cena ${i + 1}/${scenes.length}...`);
        log(`🎙️ [Cena ${i + 1}] Gravando narração de voz "${voice}"...`, "info");
        
        const result = await generateTTS(updatedScenes[i].text, voice, emo);
        const duration = await getAudioDurationOfBlob(result.blob);
        
        updatedScenes[i].audioBlob = result.blob;
        updatedScenes[i].audioDuration = duration;
        updatedScenes[i].audioMethod = result.method;
        audioSuccess++;
        
        log(`✅ [Cena ${i + 1}] Narração de ${duration.toFixed(1)}s gravada!`, "ok");
        
        // Progress (from 40% to 75%)
        setCompilationProgress(40 + Math.floor(((i + 1) / scenes.length) * 35));
      } catch (err: any) {
        updatedScenes[i].error = true;
        log(`❌ [Cena ${i + 1}] Erro na narração: ${err.message}`, "err");
      }
      
      // Brief delay between calls to be respectful to keyless APIs
      await new Promise(r => setTimeout(r, 400));
    }

    setScenes(updatedScenes);

    if (cancelCompilationRef.current) {
      setCompiling(false);
      return false;
    }

    setCompilationProgress(75);
    const successfulImages = updatedScenes.filter(s => s.imgLoaded).length;
    log(`✨ Geração Concluída: ${successfulImages}/${scenes.length} imagens e ${audioSuccess}/${scenes.length} narrações geradas com sucesso!`, "ok");
    
    if (audioSuccess === 0) {
      log("❌ Nenhuma narração pôde ser gerada. Verifique sua conexão.", "err");
      setStatusText("Erro na gravação das vozes ❌");
      setCompiling(false);
      return false;
    }

    setAssetsGenerated(true);
    return true;
  };

  // ============ OFFLINE WEB AUDIO MIXER ============
  const mixAudioTimeline = async (timings: { start: number; duration: number; pause: number; end: number }[], totalDuration: number): Promise<Blob | null> => {
    log("🎼 Mixando trilha sonora e gravações no OfflineAudioContext...", "info");
    
    const sampleRate = 44100;
    const totalSamples = Math.ceil((totalDuration + 0.5) * sampleRate);
    
    const OfflineContextClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineContextClass(1, totalSamples, sampleRate);
    
    // Online audio context to decode blobs inside mixer
    const decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 1. Render voices onto timeline
    let voiceCount = 0;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.audioBlob) {
        try {
          const arrayBuf = await scene.audioBlob.arrayBuffer();
          const decodedBuffer = await decodeCtx.decodeAudioData(arrayBuf);
          
          // Audio buffer source node
          const source = offlineCtx.createBufferSource();
          source.buffer = decodedBuffer;
          
          // Apply Voice Volume multiplier
          const gainNode = offlineCtx.createGain();
          gainNode.gain.value = volVoice / 100;
          
          source.connect(gainNode);
          gainNode.connect(offlineCtx.destination);
          
          // Position accurately on the timeline
          const startTime = timings[i].start;
          source.start(startTime);
          voiceCount++;
          
          log(`🔊 [Mixer] Voz ${i + 1} posicionada em t = ${startTime.toFixed(2)}s`, "info");
        } catch (err: any) {
          log(`⚠️ [Mixer] Falha ao decodificar trilha de voz ${i + 1}: ${err.message}`, "warn");
        }
      }
    }
    
    await decodeCtx.close();
    
    // 2. Procedural Background Synthesizer
    if (musicType !== "off") {
      log(`🎵 [Mixer] Gerando trilha sonora procedural do tipo "${musicType}"...`, "info");
      const scales: Record<string, number[]> = {
        ambient: [110, 165, 220, 277, 330, 440],
        epic: [98, 131, 165, 196, 261, 329, 392],
        calm: [131, 165, 196, 262, 329, 392, 523]
      };
      
      const notes = scales[musicType] || scales.ambient;
      const musicGain = offlineCtx.createGain();
      musicGain.gain.value = (volMusic / 100) * 0.08;
      musicGain.connect(offlineCtx.destination);
      
      let t = 0;
      while (t < totalDuration) {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        
        osc.type = musicType === "epic" ? "sawtooth" : "sine";
        // Choose beautiful chords
        const baseFrequency = notes[Math.floor(Math.random() * notes.length)];
        osc.frequency.value = baseFrequency;
        
        // Slow attack and decay envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.8);
        
        // Lowpass filter to keep music soft
        const lp = offlineCtx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = musicType === "epic" ? 500 : 350;
        
        osc.connect(lp);
        lp.connect(gain);
        gain.connect(musicGain);
        
        osc.start(t);
        osc.stop(t + 4.0);
        
        // Move forward slightly overlapped
        t += 1.8;
      }
    }
    
    // 3. Procedural Environmental SFX
    let activeSfx = sfxType;
    if (activeSfx === "auto") {
      activeSfx = THEMES[theme]?.sfx || "wind";
    }
    
    if (activeSfx !== "off") {
      log(`🌊 [Mixer] Sintonizando efeito ambiental procedural "${activeSfx}"...`, "info");
      const sfxGain = offlineCtx.createGain();
      sfxGain.gain.value = (volSfx / 100) * 0.12;
      sfxGain.connect(offlineCtx.destination);
      
      if (["wind", "rain", "fire"].includes(activeSfx)) {
        // Build standard white-to-pink noise buffer looping
        const noiseSize = sampleRate * 3; // 3 seconds loop
        const noiseBuff = offlineCtx.createBuffer(1, noiseSize, sampleRate);
        const data = noiseBuff.getChannelData(0);
        
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < noiseSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + 0.0555 * white;
          b1 = 0.96 * b1 + 0.2965 * white;
          b2 = 0.57 * b2 + 1.0527 * white;
          data[i] = (b0 + b1 + b2) * 0.15;
          
          if (activeSfx === "fire" && Math.random() < 0.015) {
            data[i] += (Math.random() * 2 - 1) * 0.7; // cracking spark sound
          }
        }
        
        let t = 0;
        while (t < totalDuration) {
          const source = offlineCtx.createBufferSource();
          source.buffer = noiseBuff;
          
          if (activeSfx === "wind") {
            const bp = offlineCtx.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.value = 350 + Math.sin(t * 0.4) * 150; // howling modulation
            bp.Q.value = 1.2;
            source.connect(bp);
            bp.connect(sfxGain);
          } else if (activeSfx === "rain") {
            const hp = offlineCtx.createBiquadFilter();
            hp.type = "highpass";
            hp.frequency.value = 1200;
            source.connect(hp);
            hp.connect(sfxGain);
          } else {
            source.connect(sfxGain);
          }
          
          source.start(t);
          t += 3.0;
        }
      } else if (activeSfx === "birds") {
        // Natural synthetic bird chirping intervals
        let t = 0.5;
        while (t < totalDuration) {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          const lfo = offlineCtx.createOscillator();
          const lfoGain = offlineCtx.createGain();
          
          osc.frequency.value = 1800 + Math.random() * 1200;
          lfo.frequency.value = 20 + Math.random() * 25;
          lfoGain.gain.value = 350;
          
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          
          const dur = 0.1 + Math.random() * 0.15;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
          gain.gain.linearRampToValueAtTime(0, t + dur);
          
          osc.connect(gain);
          gain.connect(sfxGain);
          
          osc.start(t);
          lfo.start(t);
          osc.stop(t + dur + 0.05);
          lfo.stop(t + dur + 0.05);
          
          t += 1.0 + Math.random() * 3.0;
        }
      } else if (activeSfx === "thunder") {
        // Low thunder crash waves
        let t = 3.0;
        while (t < totalDuration) {
          const crashBuff = offlineCtx.createBuffer(1, sampleRate * 3, sampleRate);
          const data = crashBuff.getChannelData(0);
          for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.7)) * 0.5;
          }
          const source = offlineCtx.createBufferSource();
          source.buffer = crashBuff;
          const filter = offlineCtx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 150;
          
          source.connect(filter);
          filter.connect(sfxGain);
          source.start(t);
          
          t += 10.0 + Math.random() * 12.0;
        }
      } else if (activeSfx === "water") {
        // Soft rolling bubbling water
        const bubbleBuff = offlineCtx.createBuffer(1, sampleRate * 3, sampleRate);
        const data = bubbleBuff.getChannelData(0);
        let b0 = 0;
        for (let i = 0; i < data.length; i++) {
          b0 = 0.97 * b0 + 0.12 * (Math.random() * 2 - 1);
          data[i] = b0 * 0.35;
        }
        let t = 0;
        while (t < totalDuration) {
          const source = offlineCtx.createBufferSource();
          source.buffer = bubbleBuff;
          source.connect(sfxGain);
          source.start(t);
          t += 3.0;
        }
      }
    }
    
    // 4. Render and compile to raw WAV Blob
    log("⏳ Renderizando mixagem offline...", "info");
    const renderedBuffer = await offlineCtx.startRendering();
    
    // Normalization / Boost peak to 0.9 if too silent
    const dataChannel = renderedBuffer.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < dataChannel.length; i++) {
      peak = Math.max(peak, Math.abs(dataChannel[i]));
    }
    if (peak > 0.01 && peak < 0.8) {
      const boost = 0.9 / peak;
      log(`📈 Aplicando boost de áudio de ${boost.toFixed(2)}x (pico de ${peak.toFixed(3)} → 0.90)`, "info");
      for (let i = 0; i < dataChannel.length; i++) {
        dataChannel[i] *= boost;
      }
    }
    
    // Convert AudioBuffer to WAV format
    const wavBlob = audioBufferToWavBlob(renderedBuffer);
    return wavBlob;
  };

  // Convert an AudioBuffer into standard 16-bit PCM WAV Blob
  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const headerSize = 44;
    const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(arrayBuffer);
    
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // Linear PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);
    
    let offset = 44;
    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }
    
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit Signed Integer
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample | 0, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  // ============ LIVE CANVAS COMPILATION & RECORDING ============
  const runFullCompilationPipeline = async () => {
    // 1. Generate assets first if not already present
    let success = assetsGenerated;
    if (!success) {
      success = await generateAssetsOnly();
    }
    if (!success) return;

    setCompiling(true);
    setStatusText("🎬 Renderizando trilhas de vídeo e legenda...");
    log("🎞️ Iniciando gravação do stream do Canvas...", "info");

    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas ref is missing!");
      setCompiling(false);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alert("Canvas context 2D is missing!");
      setCompiling(false);
      return;
    }

    // Capture standard 30fps stream from canvas
    const stream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 6_500_000 // 6.5 Mbps for crisp details
    });

    const chunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    // Calculate accurate scene timings & padding
    let currentOffset = 0;
    const timings = scenes.map((scene, i) => {
      const audioDur = scene.audioDuration || 6;
      const start = currentOffset;
      const duration = audioDur;
      const pause = i < scenes.length - 1 ? pauseBetween : 0;
      const end = start + duration + pause;
      currentOffset = end;
      return { start, duration, pause, end };
    });

    let totalDuration = currentOffset;
    let paddingLast = 0;
    if (totalDuration < minDuration) {
      paddingLast = minDuration - totalDuration;
      totalDuration = minDuration;
      timings[timings.length - 1].end += paddingLast;
    }

    log(`⏱️ Tempo total de vídeo planejado: ${totalDuration.toFixed(1)}s`, "info");
    mediaRecorder.start(1000); // chunk every 1s

    const startTimeStamp = performance.now();
    let currentSceneIdx = 0;

    // Render loop helper
    const renderFrameAndAdvance = (): Promise<void> => {
      return new Promise((resolve) => {
        function tick() {
          if (cancelCompilationRef.current) {
            resolve();
            return;
          }

          const now = performance.now();
          const elapsedSeconds = (now - startTimeStamp) / 1000;
          
          if (elapsedSeconds >= totalDuration) {
            resolve();
            return;
          }

          // Find current active scene index based on time
          let activeScene = scenes.length - 1;
          for (let s = 0; s < timings.length; s++) {
            if (elapsedSeconds >= timings[s].start && elapsedSeconds < timings[s].end) {
              activeScene = s;
              break;
            }
          }

          currentSceneIdx = activeScene;
          const sceneTimings = timings[activeScene];
          const sceneElapsed = elapsedSeconds - sceneTimings.start;
          
          // Percent progress within this scene
          const sceneProgress = Math.min(1, sceneElapsed / (sceneTimings.end - sceneTimings.start));
          // Global animation progress of the video
          const globalProgress = elapsedSeconds / totalDuration;

          // Word highlighters for karaoke subtitles
          let activeWordCount: number | null = null;
          if (karaoke && sceneElapsed < sceneTimings.duration) {
            const wordProgress = Math.min(1, sceneElapsed / sceneTimings.duration);
            activeWordCount = Math.max(1, Math.ceil(wordProgress * scenes[activeScene].wordsCount));
          }

          // Clean Canvas frame draw
          drawCanvasFrame(ctx, canvas.width, canvas.height, activeScene, sceneProgress, globalProgress, activeWordCount, elapsedSeconds);

          // Update progression bar (from 75% to 95%)
          setCompilationProgress(75 + Math.floor(globalProgress * 20));

          requestAnimationFrame(tick);
        }
        tick();
      });
    };

    // Execute render loop
    await renderFrameAndAdvance();

    if (cancelCompilationRef.current) {
      setCompiling(false);
      drawIdlePlaceholder();
      return;
    }

    // Stop recorder and pack into WebM blob
    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
      mediaRecorder.stop();
    });

    // Clean canvas tracks
    stream.getTracks().forEach(t => t.stop());

    const videoBlob = new Blob(chunks, { type: "video/webm" });
    setVideoBlobSize(videoBlob.size);
    const videoUrl = URL.createObjectURL(videoBlob);
    setCompiledVideoUrl(videoUrl);
    log(`🎬 Vídeo mudo compilado com sucesso! Tamanho: ${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`, "ok");

    // Mix Audio track
    setStatusText("🎵 Mixando canais de som...");
    setCompilationProgress(96);
    
    const wavBlob = await mixAudioTimeline(timings, totalDuration);
    if (wavBlob) {
      setAudioBlobSize(wavBlob.size);
      const audioUrl = URL.createObjectURL(wavBlob);
      setCompiledAudioUrl(audioUrl);
      log(`🎵 Áudio masterizado compilado! Tamanho: ${(wavBlob.size / 1024 / 1024).toFixed(2)} MB`, "ok");
    }

    setFinalDuration(totalDuration);
    setFinalVoicesCount(scenes.filter(s => s.audioBlob).length);

    setCompilationProgress(100);
    setStatusText("✅ Renderização concluída com sucesso!");
    log("🎉 SUCESSO COMPLETO: Vídeo e áudio gerados e prontos para download!", "ok");
    setCompiling(false);
  };

  // Canvas drawer helper for Ken burns, subtitles, transitions
  const drawCanvasFrame = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    activeIdx: number,
    sceneProgress: number,
    globalProgress: number,
    activeWordCount: number | null,
    totalSecondsElapsed: number
  ) => {
    const scene = scenes[activeIdx];
    ctx.clearRect(0, 0, W, H);

    // Render visual background image (with Ken burns panning)
    if (scene && scene.imgLoaded && scene.img) {
      const img = scene.img;
      const mode = scene.kenBurnsMode;
      
      let scale = 1.15;
      let panX = 0;
      let panY = 0;
      const maxPan = W * 0.08;

      if (mode === 0) {
        // Zoom in
        scale = 1.0 + 0.25 * sceneProgress;
      } else if (mode === 1) {
        // Zoom out
        scale = 1.25 - 0.25 * sceneProgress;
      } else if (mode === 2) {
        // Pan left to right
        scale = 1.15;
        panX = -maxPan + (maxPan * 2) * sceneProgress;
      } else {
        // Pan right to left
        scale = 1.15;
        panX = maxPan - (maxPan * 2) * sceneProgress;
      }

      const imgRatio = img.width / img.height;
      const canvasRatio = W / H;
      let drawW, drawH;

      if (imgRatio > canvasRatio) {
        drawH = H;
        drawW = H * imgRatio;
      } else {
        drawW = W;
        drawH = W / imgRatio;
      }

      ctx.save();
      // Center crop positioning
      const x = (W - drawW * scale) / 2 + panX;
      const y = (H - drawH * scale) / 2 + panY;
      ctx.drawImage(img, x, y, drawW * scale, drawH * scale);
      
      // Ambient darkening mask overlay
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, "rgba(0,0,0,0.3)");
      gradient.addColorStop(0.5, "rgba(0,0,0,0.05)");
      gradient.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else {
      // Solid beautiful background color
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#0F1115");
      g.addColorStop(1, "#050505");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Apply Transition layer if in active zone
    // Transition effect can be handled visually if wanted.

    // Overlay HUD texts
    const isMobile = format === "9:16";
    const padding = isMobile ? 24 : 36;
    
    // Scene indicator tag (Top left)
    ctx.save();
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 4;
    ctx.fillStyle = "#3b82f6";
    ctx.lineJoin = "round";
    const label = `Cena ${activeIdx + 1}/${scenes.length}`;
    ctx.strokeText(label, padding, padding);
    ctx.fillText(label, padding, padding);

    // Application Title tag (Top right)
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 18px 'Space Grotesk', sans-serif";
    ctx.strokeText("🪶 PICA-PAU", W - padding, padding);
    ctx.fillText("🪶 PICA-PAU", W - padding, padding);
    ctx.restore();

    // Render Subtitles
    const text = scene?.text || "";
    const size = isMobile ? 32 : 44;
    ctx.save();
    ctx.font = `bold ${size}px 'Inter', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.strokeStyle = "rgba(0,0,0,0.95)";
    ctx.lineWidth = 8;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;

    const maxTextWidth = isMobile ? W - 60 : W - 160;
    const lineHeight = Math.floor(size * 1.3);
    const bottomY = H - 80;

    if (activeWordCount !== null) {
      // Karaoke formatting: split text by space
      const words = text.split(/\s+/);
      const highlightedWords = words.slice(0, activeWordCount);
      const highlightedText = highlightedWords.join(" ");

      // Wrap whole text to get line layout
      const lines = wrapCanvasText(ctx, text, maxTextWidth);
      
      lines.forEach((line, lineIdx) => {
        const y = bottomY - (lines.length - 1 - lineIdx) * lineHeight;
        
        // Draw black background stroke first
        ctx.strokeStyle = "rgba(0,0,0,0.95)";
        ctx.strokeText(line, W / 2, y);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(line, W / 2, y);

        // Highlight karaoke words if they are on this line
        const wordsOnThisLine = line.split(/\s+/);
        let accumulatedText = "";
        
        // Find line's word offsets to highlight
        let wordOffsetX = 0;
        const totalLineWidth = ctx.measureText(line).width;
        let lineWordStart = W / 2 - totalLineWidth / 2;

        wordsOnThisLine.forEach((w) => {
          // Check if this word is inside the highlightedWords list
          const isHighlighted = highlightedWords.some(hw => hw.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"") === w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,""));
          
          ctx.save();
          if (isHighlighted) {
            ctx.fillStyle = "#3b82f6"; // glowing blue
            ctx.fillText(w, lineWordStart + wordOffsetX, y);
          }
          ctx.restore();

          // Move cursor by word width plus space
          wordOffsetX += ctx.measureText(w + " ").width;
        });
      });
    } else {
      // Standard subtitle
      const lines = wrapCanvasText(ctx, text, maxTextWidth);
      lines.forEach((line, lineIdx) => {
        const y = bottomY - (lines.length - 1 - lineIdx) * lineHeight;
        ctx.strokeText(line, W / 2, y);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(line, W / 2, y);
      });
    }

    // Dynamic linear timeline track (Bottom)
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(40, H - 24, W - 80, 6);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(40, H - 24, (W - 80) * globalProgress, 6);
    ctx.restore();
  };

  // Helper to wrap text over canvas width boundaries
  const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Synchronous simultaneous playback of mudo video + WAV narrator inside preview frame
  const handleToggleSyncPlayback = () => {
    const video = videoPreviewRef.current;
    const audio = audioPreviewRef.current;
    if (!video || !audio) return;

    if (isPlayingSync) {
      // Pause
      video.pause();
      audio.pause();
      setIsPlayingSync(false);
    } else {
      // Play locked
      video.currentTime = 0;
      audio.currentTime = 0;
      
      // Sync on play
      video.play().then(() => {
        audio.play().catch(e => console.warn(e));
      });
      setIsPlayingSync(true);

      // Listen for ending
      video.onended = () => {
        setIsPlayingSync(false);
      };
    }
  };

  const cancelCompilation = () => {
    cancelCompilationRef.current = true;
    log("⏹️ Renderização interrompida pelo usuário.", "warn");
    setStatusText("Renderização cancelada.");
    setCompiling(false);
    drawIdlePlaceholder();
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] font-sans p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row items-center justify-between bg-[#0A0C10] border border-[#1E293B] p-5 rounded-2xl gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-900/20 text-white">
              🪶
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                PICA-PAU <span className="text-blue-500 font-normal">v12.0</span>
              </h1>
              <p className="text-slate-400 text-sm">
                Roteiros de IA com Gemini & Mídias com Pollinations • Sem burocracia
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#1A1D24] border border-[#334155] text-slate-400 text-xs font-semibold rounded-full flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              Conectado ao Cloud Run
            </span>
            <span className="px-3 py-1 bg-[#1A1D24] border border-[#334155] text-slate-300 text-xs font-mono rounded-full">
              v12.0.4 PRO
            </span>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CONFIGURATION SIDEBAR: 5 COLS */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* TABS SELECTOR */}
            <div className="bg-[#0A0C10] border border-[#1E293B] p-1.5 rounded-xl flex gap-1">
              <button 
                onClick={() => setActiveTab("script")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${activeTab === "script" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:text-white"}`}
              >
                <Sparkles className="w-4 h-4" />
                1. Roteiro / Tema
              </button>
              <button 
                onClick={() => setActiveTab("custom")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${activeTab === "custom" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:text-white"}`}
              >
                <Sliders className="w-4 h-4" />
                2. Estilos & Sons
              </button>
              <button 
                onClick={() => setActiveTab("timings")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${activeTab === "timings" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:text-white"}`}
              >
                <Settings className="w-4 h-4" />
                3. Ritmo & Legendas
              </button>
            </div>

            {/* TAB CONTAINER */}
            <div className="bg-[#0A0C10] border border-[#1E293B] p-6 rounded-2xl flex flex-col gap-5 min-h-[500px]">
              
              {/* TAB 1: SCRIPT/GENERATE */}
              {activeTab === "script" && (
                <div className="flex flex-col gap-5 animate-fadeInUp">
                  
                  {/* GEMINI PROMPT MODULE */}
                  <div className="bg-[#1A1D24] border border-[#334155] p-4 rounded-xl flex flex-col gap-3">
                    <h3 className="font-display font-bold text-sm text-blue-400 flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      Assistente de Roteiro Gemini AI
                    </h3>
                    
                    <div>
                      <label className="text-xs text-slate-300 block mb-1 font-semibold">Tema ou Assunto Central:</label>
                      <input 
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ex: Pica-pau inventor que cria uma máquina voadora..."
                        className="w-full bg-[#0A0C10] border border-[#334155] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1 font-semibold">Diretrizes / Humor / Tom:</label>
                      <textarea
                        value={extraInstructions}
                        onChange={(e) => setExtraInstructions(e.target.value)}
                        placeholder="Ex: Narrado em tom de comédia rápida, ideal para público jovem..."
                        className="w-full h-16 bg-[#0A0C10] border border-[#334155] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1 font-semibold">Cenas:</label>
                        <select 
                          value={numCenas}
                          onChange={(e) => setNumCenas(Number(e.target.value))}
                          className="w-full bg-[#0A0C10] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none"
                        >
                          <option value={3}>3 Cenas (Rápido)</option>
                          <option value={5}>5 Cenas (Médio)</option>
                          <option value={8}>8 Cenas (Completo)</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={generateStoryWithGemini}
                        disabled={isGeneratingStory}
                        className="h-9 mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
                      >
                        {isGeneratingStory ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Pensando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Gerar com Gemini AI
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* SCRIPT EDITOR */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-200">Roteiro Atual (Parágrafos):</label>
                      <button 
                        onClick={() => {
                          setManualText("");
                          setScenes([]);
                        }}
                        className="text-slate-500 hover:text-rose-400 transition text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Limpar tudo
                      </button>
                    </div>
                    
                    <textarea
                      value={manualText}
                      onChange={(e) => {
                        setManualText(e.target.value);
                        parseManualStory(e.target.value);
                      }}
                      placeholder="Cole sua história aqui. Cada parágrafo será convertido em uma cena ilustrada individual..."
                      className="w-full h-44 bg-[#1A1D24] border border-[#334155] rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      💡 <strong>Dica:</strong> Separe as cenas pulando duas linhas. Cada parágrafo gera uma cena ilustrada e um áudio de locução próprio.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: STYLE & AUDIO CONFIGS */}
              {activeTab === "custom" && (
                <div className="flex flex-col gap-4 animate-fadeInUp">
                  
                  {/* RATIO SELECTION */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-2 font-bold uppercase tracking-wider">Formato do Vídeo</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFormat("16:9")}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${format === "16:9" ? "border-blue-500 bg-blue-600/20 text-blue-400" : "border-[#334155] bg-[#1A1D24] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                      >
                        <Tv className="w-6 h-6" />
                        <span className="text-xs font-bold">16:9 (Horizontal / YouTube)</span>
                      </button>
                      
                      <button
                        onClick={() => setFormat("9:16")}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${format === "9:16" ? "border-blue-500 bg-blue-600/20 text-blue-400" : "border-[#334155] bg-[#1A1D24] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                      >
                        <Smartphone className="w-6 h-6" />
                        <span className="text-xs font-bold">9:16 (Vertical / Shorts / TikTok)</span>
                      </button>
                    </div>
                  </div>

                  {/* THEME & ART STYLE */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold uppercase">Tema de Fundo</label>
                      <select
                        value={theme}
                        onChange={(e) => {
                          setTheme(e.target.value);
                          // trigger update to update prompt preloads
                          setTimeout(() => parseManualStory(manualText), 50);
                        }}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {Object.entries(THEMES).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.icon} {v.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold uppercase">Estilo Artístico</label>
                      <select
                        value={style}
                        onChange={(e) => {
                          setStyle(e.target.value);
                          setTimeout(() => parseManualStory(manualText), 50);
                        }}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {Object.entries(STYLES).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.icon} {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* TTS SPEAKER VOICE */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold uppercase">Voz Narrador (TTS)</label>
                      <select
                        value={ttsVoice}
                        onChange={(e) => setTtsVoice(e.target.value)}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {VOICES.map((v) => (
                          <option key={v.id} value={v.id}>
                            🗣️ {v.name} ({v.gender})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold uppercase">Emoção Vocal</label>
                      <select
                        value={emotion}
                        onChange={(e) => setEmotion(e.target.value)}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">😐 Normal</option>
                        <option value="[sussurrando]">🤫 Sussurrado</option>
                        <option value="[dramaticamente]">🎭 Dramático</option>
                        <option value="[animadamente]">😊 Alegre / Entusiasta</option>
                        <option value="[tristemente]">😢 Triste / Melancólico</option>
                        <option value="[misteriosamente]">🕵️ Misterioso / Suspense</option>
                      </select>
                    </div>
                  </div>

                  {/* SOUNDTRACK & PROCEDURAL SOUNDS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold uppercase">Efeitos Sonoros (SFX)</label>
                      <select
                        value={sfxType}
                        onChange={(e) => setSfxType(e.target.value)}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="auto">🧠 Automático (Por Tema)</option>
                        <option value="off">🔇 Sem Efeitos</option>
                        <option value="birds">🐦 Pássaros Cantando</option>
                        <option value="thunder">⚡ Tempestade / Trovão</option>
                        <option value="wind">💨 Vento Soprando</option>
                        <option value="rain">🌧️ Chuva Fina</option>
                        <option value="water">💧 Borbulhas de Água</option>
                        <option value="fire">🔥 Fogueira Estalando</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold uppercase">Trilha Sonora Procedural</label>
                      <select
                        value={musicType}
                        onChange={(e) => setMusicType(e.target.value)}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="ambient">🌌 Sintetizador Espacial/Ambiental</option>
                        <option value="epic">⚔️ Sintetizador Épico/Aventura</option>
                        <option value="calm">🧘 Harmonia Calma/Zen</option>
                        <option value="off">🔇 Sem Música</option>
                      </select>
                    </div>
                  </div>

                  {/* MIX VOLUMES */}
                  <div className="bg-[#1A1D24] border border-[#334155] p-4 rounded-xl flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" />
                      Mixagem do Volume de Áudio
                    </h4>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Narrador (Voz):</span>
                        <span className="font-semibold font-mono text-white">{volVoice}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="150" 
                        value={volVoice}
                        onChange={(e) => setVolVoice(Number(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Música de Fundo:</span>
                        <span className="font-semibold font-mono text-white">{volMusic}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={volMusic}
                        onChange={(e) => setVolMusic(Number(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Sons Ambientes (SFX):</span>
                        <span className="font-semibold font-mono text-white">{volSfx}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={volSfx}
                        onChange={(e) => setVolSfx(Number(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PAUSES & SUBTITLE STYLES */}
              {activeTab === "timings" && (
                <div className="flex flex-col gap-5 animate-fadeInUp">
                  
                  {/* TRANSITION TIMINGS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold uppercase">Transição Cenas</label>
                      <select
                        value={transitionType}
                        onChange={(e) => {
                          setTransitionType(e.target.value);
                          setTimeout(() => parseManualStory(manualText), 50);
                        }}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="auto">🎲 Aleatória / Randômica</option>
                        <option value="fade">🌫️ Fade / Esmaecer</option>
                        <option value="slide">➡️ Slide / Deslizar</option>
                        <option value="wipe">🧽 Wipe / Revelar</option>
                        <option value="zoom">🔍 Zoom / Lente</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-bold uppercase">Código Semente (Seed)</label>
                      <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-semibold leading-tight">Duração Mínima</label>
                      <input
                        type="number"
                        value={minDuration}
                        min={10}
                        max={180}
                        onChange={(e) => setMinDuration(Number(e.target.value))}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Sg. Mínimos</span>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-semibold leading-tight">Pausa de Fala</label>
                      <input
                        type="number"
                        value={pauseBetween}
                        step={0.5}
                        min={0}
                        max={5}
                        onChange={(e) => setPauseBetween(Number(e.target.value))}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Sg. Entre falas</span>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-semibold leading-tight">Duração Transição</label>
                      <input
                        type="number"
                        value={transitionDuration}
                        step={0.1}
                        min={0.2}
                        max={3}
                        onChange={(e) => setTransitionDuration(Number(e.target.value))}
                        className="w-full bg-[#1A1D24] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Segundos</span>
                    </div>
                  </div>

                  {/* KARAOKE OPTION */}
                  <div className="bg-[#1A1D24] border border-[#334155] p-4 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5" />
                        Legendas Inteligentes
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">Destaque de palavras em tempo real (Karaoke)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={karaoke} 
                        onChange={(e) => setKaraoke(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-slate-900"></div>
                    </label>
                  </div>

                  {/* TEST VOICE RECORDER */}
                  <div className="bg-[#1A1D24] border border-dashed border-[#334155] p-4 rounded-xl flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      Testar Mecanismo de Locução IA
                    </h4>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          const statusNode = document.getElementById("ttsTestStatus");
                          if (statusNode) statusNode.textContent = "⏳ Gerando voz de teste via IA...";
                          try {
                            const result = await generateTTS("Olá! Esta é a voz de teste do aplicativo Pica-Pau. O sistema de locução inteligente está operando perfeitamente!", ttsVoice, emotion);
                            const audio = new Audio();
                            audio.src = URL.createObjectURL(result.blob);
                            audio.play();
                            if (statusNode) statusNode.textContent = `🔊 Reproduzindo via ${result.method}!`;
                          } catch (e: any) {
                            if (statusNode) statusNode.textContent = `❌ Erro: ${e.message}`;
                          }
                        }}
                        className="flex-1 py-1.5 bg-[#0A0C10] hover:bg-slate-800 border border-[#334155] text-slate-200 text-xs font-bold rounded-lg transition"
                      >
                        🔊 Testar Voz Narrador
                      </button>
                    </div>
                    <div id="ttsTestStatus" className="text-[10px] text-slate-500 italic text-center">
                      Locução instantânea via Pollinations AI
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* PREVIEW CONTAINER & RENDERER: 7 COLS */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* CANVAS PREVIEW SECTION */}
            <div className="bg-[#0A0C10] border border-[#1E293B] p-6 rounded-2xl flex flex-col items-center gap-4">
              <div className="w-full flex items-center justify-between border-b border-[#1E293B] pb-3">
                <h2 className="font-display font-bold text-slate-100 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  Monitor do Vídeo
                </h2>
                
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-400 tracking-wider">
                    {format === "16:9" ? "1280x720 (16:9)" : "720x1280 (9:16)"}
                  </span>
                </div>
              </div>

              {/* DYNAMIC CANVAS WRAPPER */}
              <div 
                className={`relative border-2 border-[#1E293B] bg-slate-950 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 w-full max-w-full ${format === "9:16" ? "max-h-[500px] aspect-[9/16] max-w-[280px]" : "aspect-[16/9]"}`}
              >
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full block bg-black"
                />
                
                {/* COMPILING OVERLAY SCREEN */}
                {compiling && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-4 animate-fade-in z-20">
                    <div className="relative flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
                      <span className="absolute text-xs font-bold font-mono text-blue-400">{compilationProgress}%</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold tracking-tight">Gravando Renderizador</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                        Desenhando transições, ken burns, e misturando ondas sonoras na timeline...
                      </p>
                    </div>
                    <div className="w-full max-w-[240px] bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all" style={{ width: `${compilationProgress}%` }} />
                    </div>
                    <button 
                      onClick={cancelCompilation}
                      className="px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg hover:bg-rose-500/20 transition font-semibold"
                    >
                      Cancelar Gravação
                    </button>
                  </div>
                )}
              </div>

              {/* ACTION TRIGGER BUTTONS */}
              <div className="w-full grid grid-cols-2 gap-4">
                <button
                  onClick={runFullCompilationPipeline}
                  disabled={compiling || isGeneratingStory}
                  className="py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 cursor-pointer text-sm sm:text-base"
                >
                  <Film className="w-5 h-5" />
                  {compiling ? "Gravando Vídeo..." : "🚀 GERAR VÍDEO COMPLETO"}
                </button>
                
                <button
                  onClick={async () => {
                    const r = await generateAssetsOnly();
                    if (r) {
                      setCompiling(false);
                      alert("Artes e narrações geradas com sucesso! Você pode visualizar as miniaturas de cena abaixo, ou clicar em Gerar Vídeo Completo para exportar.");
                    }
                  }}
                  disabled={compiling || isGeneratingStory}
                  className="py-3 bg-[#1A1D24] border border-[#334155] hover:bg-slate-800/50 disabled:opacity-50 text-slate-300 font-semibold rounded-xl transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  🔄 Gerar Mídias IA (Sincronizar)
                </button>
              </div>

              {/* STATUS INDICATOR BAR */}
              <div className="w-full py-2 px-3 bg-slate-950 rounded-lg text-xs font-mono flex items-center justify-between border border-[#1E293B]">
                <span className="text-slate-400">STATUS:</span>
                <span className="text-blue-400 font-bold">{statusText}</span>
              </div>
            </div>

            {/* RESULTS DOWNLOAD AND CAPCUT SYNC ZONE */}
            <AnimatePresence>
              {compiledVideoUrl && compiledAudioUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-[#1A1D24] border border-[#334155] p-6 rounded-2xl flex flex-col gap-5 animate-fadeInUp"
                >
                  <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                    <h3 className="font-display font-bold text-white flex items-center gap-2">
                      <Check className="w-5 h-5 text-blue-400" />
                      Exportação Pronta!
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                      Duração: {finalDuration.toFixed(1)}s • {finalVoicesCount} cenas
                    </span>
                  </div>

                  {/* PREVIEW CONTROLS & PLAYER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* VIDEO PLAYER CARD */}
                    <div className="bg-[#0A0C10] p-4 rounded-xl flex flex-col gap-3 border border-[#1E293B]">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">🎬 Vídeo Principal (Sem som)</div>
                      <video 
                        ref={videoPreviewRef}
                        src={compiledVideoUrl} 
                        controls 
                        muted 
                        className="w-full aspect-[16/9] bg-black rounded-lg border border-[#334155]"
                      />
                      <button
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = compiledVideoUrl;
                          a.download = `picapau-video-${Date.now()}.webm`;
                          a.click();
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar Vídeo ({(videoBlobSize / 1024 / 1024).toFixed(1)} MB)
                      </button>
                    </div>

                    {/* AUDIO PLAYER CARD */}
                    <div className="bg-[#0A0C10] p-4 rounded-xl flex flex-col gap-3 border border-[#1E293B]">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">🎵 Trilha Masterizada (Voz+Sons)</div>
                      <audio 
                        ref={audioPreviewRef}
                        src={compiledAudioUrl} 
                        controls 
                        className="w-full bg-slate-950 rounded-lg border border-[#334155] p-1"
                      />
                      <button
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = compiledAudioUrl;
                          a.download = `picapau-audio-${Date.now()}.wav`;
                          a.click();
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar Áudio ({(audioBlobSize / 1024 / 1024).toFixed(1)} MB)
                      </button>
                    </div>

                  </div>

                  {/* MASTER SYNC PLAYBACK BUTTON */}
                  <button
                    onClick={handleToggleSyncPlayback}
                    className="w-full py-3 bg-[#1E293B] hover:bg-slate-800 border border-[#334155] text-slate-200 font-bold rounded-xl transition flex items-center justify-center gap-2.5 shadow-lg shadow-slate-900/40 cursor-pointer"
                  >
                    {isPlayingSync ? (
                      <>
                        <Pause className="w-5 h-5 animate-pulse text-blue-400" />
                        Pausar Amostra Sincronizada
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 text-blue-500" />
                        ▶️ REPRODUZIR EM SINCRONIA NO MONITOR
                      </>
                    )}
                  </button>

                  {/* SHORT INSTRUCTIONS FOR CAPCUT */}
                  <div className="bg-slate-950/40 p-4 border border-[#334155] rounded-xl flex gap-3 text-xs text-slate-300 leading-relaxed">
                    <div className="text-lg">🎬</div>
                    <div>
                      <strong className="text-white block mb-1">Como juntar no CapCut em 30 segundos:</strong>
                      <ol className="list-decimal pl-4 flex flex-col gap-1">
                        <li>Baixe o arquivo de <strong>vídeo</strong> e de <strong>áudio</strong> pelos botões acima.</li>
                        <li>Abra seu editor (CapCut / TikTok) e clique em "Novo Projeto".</li>
                        <li>Importe o vídeo e adicione o arquivo de áudio na trilha de som logo abaixo.</li>
                        <li>Pronto! Eles têm a <strong>mesma duração</strong> e se encaixam perfeitamente para publicação!</li>
                      </ol>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LIVE CONSOLE LOGS TERMINAL */}
            <div className="bg-[#0A0C10] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="bg-slate-950 px-4 py-2 border-b border-[#1E293B] flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  Terminal de Gravação
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div 
                ref={logContainerRef}
                className="h-44 p-4 font-mono text-xs overflow-y-auto flex flex-col gap-2 bg-[#050505]"
              >
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic">Nenhum log no momento. Inicie uma renderização...</div>
                ) : (
                  logs.map((l) => (
                    <div key={l.id} className="flex gap-2 leading-relaxed">
                      <span className="text-slate-500">[{l.time}]</span>
                      <span className={
                        l.type === "ok" ? "text-emerald-400" :
                        l.type === "warn" ? "text-amber-400" :
                        l.type === "err" ? "text-rose-400" : "text-slate-300"
                      }>
                        {l.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SCENES THUMBNAIL TRACKS */}
            {scenes.length > 0 && (
              <div className="bg-[#0A0C10] border border-[#1E293B] p-5 rounded-2xl flex flex-col gap-3">
                <h3 className="font-display font-bold text-sm text-slate-300">Miniaturas das Cenas Geradas:</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {scenes.map((scene, idx) => (
                    <div 
                      key={idx} 
                      className={`relative aspect-[16/9] rounded-lg border-2 overflow-hidden bg-[#1A1D24] flex flex-col justify-between p-1.5 transition ${scene.imgLoaded ? "border-blue-500/50" : "border-[#334155]"}`}
                    >
                      {scene.imgLoaded && scene.imgUrl ? (
                        <img 
                          src={scene.imgUrl} 
                          alt={`Cena ${idx + 1}`} 
                          className="absolute inset-0 w-full h-full object-cover z-0"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xl z-0 opacity-45">
                          ⏳
                        </div>
                      )}
                      
                      <div className="relative z-10 self-start bg-black/75 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </div>

                      <div className="relative z-10 self-end bg-black/75 text-slate-300 text-[9px] font-mono font-semibold px-1 py-0.5 rounded truncate max-w-[90%]">
                        {scene.audioDuration ? `🎙️ ${scene.audioDuration.toFixed(1)}s` : "⏳ voz"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

      <footer className="max-w-7xl mx-auto w-full text-center py-6 mt-8 text-slate-500 text-xs border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          🚀 Desenvolvido com 💛 por AI Coding Agent para <strong>picapauinformatica@gmail.com</strong>
        </div>
        <div className="flex gap-4">
          <span className="text-slate-400">Termos do Projeto</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-400">Tecnologia Pollinations & Gemini 3.5</span>
        </div>
      </footer>
    </div>
  );
}
