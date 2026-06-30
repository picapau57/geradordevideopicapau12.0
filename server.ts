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

      // Resolve custom voices to standard OpenAI voice IDs and inject vocal style prefixes
      let finalVoice = voice || "nova";
      let extraEmo = "";
      
      if (voice === "coral") {
        finalVoice = "shimmer";
        extraEmo = "[com voz jovem, alegre e entusiasmada]";
      } else if (voice === "melody") {
        finalVoice = "nova";
        extraEmo = "[com voz doce, carismática e suave]";
      } else if (voice === "stella") {
        finalVoice = "shimmer";
        extraEmo = "[com voz sofisticada, pausada e elegante]";
      } else if (voice === "ash") {
        finalVoice = "echo";
        extraEmo = "[com voz jovem, casual e amigável]";
      } else if (voice === "cove") {
        finalVoice = "onyx";
        extraEmo = "[com voz calorosa, calma e acolhedora]";
      } else if (voice === "breeze") {
        finalVoice = "echo";
        extraEmo = "[com voz enérgica, forte e motivadora]";
      }

      const combinedEmo = emo ? (extraEmo ? `${extraEmo} ${emo}` : emo) : extraEmo;
      const fullText = combinedEmo ? `${combinedEmo} ${text}` : text;

      console.log(`[TTS Proxy] Iniciando para: "${fullText.substring(0, 40)}..." | Voz: ${finalVoice}`);

      // Método 1: POST para text.pollinations.ai/openai com model: openai-audio
      try {
        const response = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: fullText }],
            model: "openai-audio",
            voice: finalVoice,
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
              const buffer = Buffer.from(base64Audio, "base64");
              res.setHeader("Content-Type", "audio/mp3");
              res.setHeader("X-TTS-Method", "Server-POST-Base64");
              console.log(`[TTS Proxy] Sucesso via POST (Base64 JSON)`);
              return res.send(buffer);
            }
          } else {
            // Raw binary response
            const buffer = Buffer.from(responseText, "binary");
            res.setHeader("Content-Type", "audio/mp3");
            res.setHeader("X-TTS-Method", "Server-POST-Binary");
            console.log(`[TTS Proxy] Sucesso via POST (Raw Binary)`);
            return res.send(buffer);
          }
        } else {
          console.warn(`[TTS Proxy] POST falhou com status ${response.status}: ${response.statusText}`);
        }
      } catch (postErr: any) {
        console.warn(`[TTS Proxy] POST erro:`, postErr.message);
      }

      // Método 2: GET fallback com model: openai-audio
      try {
        const url = `https://text.pollinations.ai/${encodeURIComponent(fullText)}?model=openai-audio&voice=${finalVoice}`;
        console.log(`[TTS Proxy] Tentando GET fallback: ${url.substring(0, 80)}...`);
        const response = await fetch(url);
        if (response.ok) {
          const responseBlob = await response.blob();
          const arrayBuffer = await responseBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const textVal = buffer.toString("utf-8");
          if (textVal.trim().startsWith("{")) {
            const parsed = JSON.parse(textVal);
            const base64Audio = parsed.choices?.[0]?.message?.audio?.data || parsed.audio;
            if (base64Audio) {
              const decodedBuffer = Buffer.from(base64Audio, "base64");
              res.setHeader("Content-Type", "audio/mp3");
              res.setHeader("X-TTS-Method", "Server-GET-Base64");
              console.log(`[TTS Proxy] Sucesso via GET (Base64 JSON)`);
              return res.send(decodedBuffer);
            }
          }
          
          res.setHeader("Content-Type", "audio/mp3");
          res.setHeader("X-TTS-Method", "Server-GET-Raw");
          console.log(`[TTS Proxy] Sucesso via GET (Raw Blob)`);
          return res.send(buffer);
        } else {
          console.warn(`[TTS Proxy] GET falhou com status ${response.status}: ${response.statusText}`);
        }
      } catch (getErr: any) {
        console.warn(`[TTS Proxy] GET erro:`, getErr.message);
      }

      // Método 3: GET fallback com model: openai (caso o openai-audio de GET retorne 404)
      try {
        const url = `https://text.pollinations.ai/${encodeURIComponent(fullText)}?model=openai&voice=${finalVoice}`;
        console.log(`[TTS Proxy] Tentando GET alternativa (model=openai): ${url.substring(0, 80)}...`);
        const response = await fetch(url);
        if (response.ok) {
          const responseBlob = await response.blob();
          const arrayBuffer = await responseBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const textVal = buffer.toString("utf-8");
          if (textVal.trim().startsWith("{")) {
            const parsed = JSON.parse(textVal);
            const base64Audio = parsed.choices?.[0]?.message?.audio?.data || parsed.audio;
            if (base64Audio) {
              const decodedBuffer = Buffer.from(base64Audio, "base64");
              res.setHeader("Content-Type", "audio/mp3");
              res.setHeader("X-TTS-Method", "Server-GET-OpenAI-Base64");
              console.log(`[TTS Proxy] Sucesso via GET model=openai (Base64 JSON)`);
              return res.send(decodedBuffer);
            }
          }
          
          res.setHeader("Content-Type", "audio/mp3");
          res.setHeader("X-TTS-Method", "Server-GET-OpenAI-Raw");
          console.log(`[TTS Proxy] Sucesso via GET model=openai (Raw Blob)`);
          return res.send(buffer);
        } else {
          console.warn(`[TTS Proxy] GET model=openai falhou com status ${response.status}`);
        }
      } catch (getOpenAiErr: any) {
        console.warn(`[TTS Proxy] GET model=openai erro:`, getOpenAiErr.message);
      }

      // Método 4: Fallback definitivo usando Google Translate TTS (super estável e rápido para português e inglês)
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
