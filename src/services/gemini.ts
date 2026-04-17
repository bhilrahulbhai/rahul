import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please ensure GEMINI_API_KEY is set in your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const ai = getAI();
  const model = "gemini-3-flash-preview";

  const contents = [
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: m.parts
    })),
    { role: 'user', parts: [{ text: message }] }
  ];
  
  const response = await ai.models.generateContent({
    model: model,
    config: {
      systemInstruction: "You are BhaktiSagar AI, a helpful assistant for a devotional platform. You help users find bhajans, understand sacred stories, and explore spiritual content. Be respectful, calm, and knowledgeable about Indian spirituality and culture.",
    },
    contents: contents as any,
  });

  return response.text;
}
