import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini story generation
  app.post("/api/generate-story", async (req, res) => {
    try {
      const { topic, prompt, count } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "A chave de API GEMINI_API_KEY não está configurada no servidor." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const userPrompt = `Crie uma história envolvente de exatamente ${count || 6} cenas sobre o seguinte tema/assunto: "${topic || 'Aventuras na floresta'}".
Mensagem/Diretriz adicional do usuário: "${prompt || 'Crie algo divertido e emocionante.'}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: `Você é um diretor de cinema e roteirista profissional de vídeos curtos (Shorts, Reels, TikTok) e histórias ilustradas.
Sua tarefa é criar uma história cativante em português brasileiro dividida em cenas estruturadas.
Cada cena deve conter:
1. "text": O texto curto de narração em português. Deve ser dinâmico, poético ou emocionante, adequado para locução rápida (1 a 2 frases curtas por cena, máximo 150 caracteres).
2. "imagePrompt": Um prompt em INGLÊS extremamente detalhado e rico visualmente para gerar a imagem ilustrativa da cena usando uma inteligência artificial geradora de imagens. Descreva o estilo, iluminação (ex: cinematic lighting, golden hour, mist, sunset), composição (ex: wide shot, close-up), personagens e detalhes específicos. Evite usar palavras abstratas, use descrições visuais concretas. Não inclua textos na imagem.

Retorne os dados estritamente no formato JSON estruturado solicitado.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título curto da história" },
              styleSuggestion: { type: Type.STRING, description: "Sugestão de estilo visual recomendado (ex: anime, cinematic, cartoon, oil painting)" },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: "Texto curto da narração em português" },
                    imagePrompt: { type: Type.STRING, description: "Visual prompt in English for image generation" }
                  },
                  required: ["text", "imagePrompt"]
                }
              }
            },
            required: ["title", "styleSuggestion", "scenes"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Não houve retorno de texto por parte da API do Gemini.");
      }

      const storyData = JSON.parse(responseText.trim());
      res.json(storyData);
    } catch (err: any) {
      console.error("Gemini Generation Error:", err);
      res.status(500).json({ error: err.message || "Falha ao gerar história utilizando o Gemini" });
    }
  });

  // Proxy Route for images to bypass canvas drawing CORS issues in the browser
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).send("Falta o parâmetro url");
      }
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Falha ao carregar imagem: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", response.headers.get("Content-Type") || "image/png");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  });

  // Proxy Route for text-to-speech (TTS) to prevent CORS and 404/network blocks on hosting platforms like Render
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice, emo } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Falta o parâmetro text" });
      }

      // Map custom voice IDs to Gemini TTS prebuilt voices
      // Gemini Prebuilt Voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      let geminiVoice = "Kore"; // Default female voice
      let voiceDescription = "";

      // Handle raw and pre-mapped voices
      const voiceLower = (voice || "nova").toLowerCase();
      if (voiceLower === "echo" || voiceLower === "breeze") {
        geminiVoice = "Zephyr";
        voiceDescription = "Diga com voz enérgica, firme, confiável e ponderada: ";
      } else if (voiceLower === "onyx" || voiceLower === "cove") {
        geminiVoice = "Fenrir";
        voiceDescription = "Diga com voz grave, profunda, calorosa, calma e acolhedora: ";
      } else if (voiceLower === "ash") {
        geminiVoice = "Puck";
        voiceDescription = "Diga com voz jovem, casual e amigável: ";
      } else if (voiceLower === "shimmer" || voiceLower === "coral" || voiceLower === "stella") {
        geminiVoice = "Kore";
        voiceDescription = "Diga com voz suave, calma, alegre e entusiasmada: ";
      } else if (voiceLower === "nova" || voiceLower === "melody") {
        geminiVoice = "Kore";
        voiceDescription = "Diga com voz clara, energética e expressiva: ";
      } else if (voiceLower === "alloy") {
        geminiVoice = "Zephyr";
        voiceDescription = "Diga com voz equilibrada, profissional e limpa: ";
      } else if (voiceLower === "fable") {
        geminiVoice = "Charon";
        voiceDescription = "Diga de forma narrativa, misteriosa e artística: ";
      }

      let extraInstruction = "";
      if (emo) {
        extraInstruction = `[Estilo emocional: falar de forma ${emo}] `;
      }

      const fullPrompt = `${voiceDescription}${extraInstruction}"${text}"`;
      console.log(`[TTS Proxy] Iniciando Gemini TTS para: "${text.substring(0, 40)}..." | Voz: ${geminiVoice}`);

      // Método 1: Gemini TTS de Alta Qualidade e Livre de Limites de IP
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY não configurada.");
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: fullPrompt }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: geminiVoice }
              }
            }
          }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio && base64Audio.length > 100) {
          const audioBuffer = Buffer.from(base64Audio, "base64");
          res.setHeader("Content-Type", "audio/wav"); // O Gemini TTS retorna arquivo WAV nativo de alta qualidade (24kHz)
          res.setHeader("X-TTS-Method", `Server-Gemini-TTS-${geminiVoice}`);
          console.log(`[TTS Proxy] Sucesso via Gemini TTS (${geminiVoice})`);
          return res.send(audioBuffer);
        } else {
          console.warn("[TTS Proxy] Resposta do Gemini TTS não continha dados de áudio válidos.");
        }
      } catch (geminiErr: any) {
        console.warn(`[TTS Proxy] Gemini TTS falhou ou não configurado, recorrendo a fallbacks:`, geminiErr.message);
      }

      // Método 2: Fallback definitivo usando Google Translate TTS (super estável e rápido para português)
      try {
        const lang = "pt-BR"; // Como as histórias são em português do Brasil
        const cleanText = text.replace(/[*_`~[\]#]/g, "").substring(0, 200); // Remove marcações markdown básicas
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
        console.log(`[TTS Proxy] Tentando fallback Google Translate TTS: ${url.substring(0, 80)}...`);
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (response.ok) {
          const responseBlob = await response.blob();
          const arrayBuffer = await responseBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          res.setHeader("Content-Type", "audio/mp3");
          res.setHeader("X-TTS-Method", "Server-Google-Translate");
          console.log(`[TTS Proxy] Sucesso via Google Translate TTS!`);
          return res.send(buffer);
        } else {
          console.warn(`[TTS Proxy] Google Translate TTS falhou com status ${response.status}`);
        }
      } catch (googleErr: any) {
        console.warn(`[TTS Proxy] Google Translate TTS erro:`, googleErr.message);
      }

      return res.status(502).json({ error: "Todos os métodos de TTS falharam no proxy do servidor." });
    } catch (err: any) {
      console.error("[TTS Proxy] Erro crítico:", err);
      res.status(500).json({ error: err.message || "Erro interno no servidor de TTS." });
    }
  });

  // Vite development / production handling
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
