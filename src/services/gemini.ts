import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing in server environment");
}

const ai = new GoogleGenAI({ apiKey });

export async function getChatResponse(
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[]
) {
  try {
    const contents = [
      ...history.map((m) => ({
        role: m.role,
        parts: m.parts,
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction:
          "You are BhaktiSagar AI, a helpful assistant for a devotional platform. You help users find bhajans, understand sacred stories, and explore spiritual content. Be respectful, calm, and knowledgeable about Indian spirituality and culture.",
      },
    });

    return response.text || "Main aapke prashn par manan kar raha hoon.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("BhaktiSagar AI response failed");
  }
}