import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // In some production builds, process.env might not be available directly in the browser.
    // We try to access the key from common locations.
    const apiKey = (import.meta as any).env?.GEMINI_API_KEY || 
                   (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null) ||
                   (globalThis as any).GEMINI_API_KEY;

    if (!apiKey) {
      console.error("BhaktiSagar AI: Gemini API Key is missing.");
      throw new Error("Devotional AI connection failed: Spiritual key (API Key) not found. Please ensure GEMINI_API_KEY is configured in your deployment settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const ai = getAI();
  const model = "gemini-3-flash-preview";

  try {
    const contents = [
      ...history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: m.parts
      })),
      { role: 'user', parts: [{ text: message }] }
    ];
    
    const response = await ai.models.generateContent({
      model: model,
      contents: contents as any,
      config: {
        systemInstruction: "You are BhaktiSagar AI, a helpful assistant for a devotional platform. You help users find bhajans, understand sacred stories, and explore spiritual content. Be respectful, calm, and knowledgeable about Indian spirituality and culture.",
      }
    });

    return response.text || "I am reflecting on your spiritual query...";
  } catch (err) {
    console.error("Gemini API Error Detail:", err);
    throw err;
  }
}
