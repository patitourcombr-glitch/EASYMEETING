
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Creates an AI client instance. 
 * Prioritizes the key provided by the user in the UI (stored in localStorage) 
 * but falls back to the system environment variable.
 */
const getAIClient = () => {
  const userKey = localStorage.getItem('easy_api_key');
  const apiKey = userKey || process.env.API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

// Recommended model for multimodal tasks
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Analyzes meeting audio and generates a smart report.
 */
export const summarizeMeetingFromAudio = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();
  
  const audioPart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };

  const textPart = {
    text: `Analise o áudio desta reunião e gere um relatório inteligente.
    
    1. RESUMO: Um parágrafo executivo.
    2. BULLETS: Pontos de decisão com timestamps no formato [MM:SS].
    3. TRANSCRIÇÃO COM ORADORES: Gere uma transcrição estruturada onde você identifica diferentes vozes. 
       Use rótulos como "Orador 1", "Orador 2" ou os nomes reais se forem mencionados durante a fala.
       Formato esperado para transcrição: "Nome/Orador: [Conteúdo da fala]"
    
    Por favor, retorne rigorosamente em formato JSON.`
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: [audioPart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Resumo executivo da reunião" },
          bullets: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Pontos principais com timestamps no formato [MM:SS]"
          },
          transcript: { 
            type: Type.STRING, 
            description: "Transcrição diarizada com identificação de oradores (ex: Orador 1: Olá...)" 
          }
        },
        required: ["summary", "bullets", "transcript"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

/**
 * Chat with the meeting context.
 */
export const chatWithMeeting = async (meetingContext: string, userQuestion: string) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: `Você é o EASY MEETING Assistant. Você tem acesso ao contexto de uma reunião: ${meetingContext}. Responda perguntas sobre o que foi discutido de forma profissional e estratégica. Se o usuário pedir para redigir um email de follow-up, use um tom corporativo moderno.`
    }
  });

  const response = await chat.sendMessage({ message: userQuestion });
  return response.text;
};

/**
 * Get quick strategy advice based on partial transcript.
 */
export const getLiveStrategy = async (partialTranscript: string, userPrompt: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Contexto da reunião (capturado via microfone agora): "${partialTranscript}". 
    Dúvida do usuário: "${userPrompt}". 
    Dê um conselho ou estratégia rápida (máximo 2 parágrafos) para o usuário aplicar imediatamente na reunião.`
  });
  return response.text;
};
