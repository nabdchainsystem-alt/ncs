import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const API_KEY = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `أنت شريك إنتاجية ذكي ومدروس تعيش داخل مفكرة رقمية.
أسلوبك هادئ، ومختصر، ومتطور—مثل مفكرة منظمة جيدًا.
ساعد المستخدم بشكل صارم في سير عمل "إنجاز الأمور" (GTD)، والتفكير، والعصف الذهني.
تجنب استخدام عناوين ماركداون مثل # أو ## بشكل مفرط؛ يفضل استخدام النقاط والنصوص الغامقة للحفاظ على تدفق الكتابة.
إذا طلب المستخدم كودًا، قدمه بشكل نظيف.
تحدث باللغة العربية دائمًا ما لم يطلب المستخدم خلاف ذلك.`;

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
};

export const sendMessageStream = async (
  chat: Chat,
  message: string,
  history: Message[]
): Promise<AsyncGenerator<GenerateContentResponse, void, unknown>> => {
  // We don't need to manually pass history as the Chat object maintains it, 
  // but in a real persistent app we might reconstruct history.
  // For this session-based demo, we rely on the chat instance.
  
  try {
    const streamResult = await chat.sendMessageStream({ message });
    return streamResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};