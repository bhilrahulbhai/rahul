import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const model = "gemini-3.1-pro-preview";
  
  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: "You are BhaktiSagar AI, a helpful assistant for a devotional platform. You help users find bhajans, understand sacred stories, and explore spiritual content. Be respectful, calm, and knowledgeable about Indian spirituality and culture.",
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
