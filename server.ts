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
