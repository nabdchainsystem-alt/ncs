import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion } from "../types";

// Initialize Gemini
// Note: In a real app, use an environment variable for the key. 
// Assuming process.env.API_KEY is available or configured in vite.config
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const clarifyInboxItem = async (content: string): Promise<AISuggestion | null> => {
    if (!apiKey) {
        console.warn("Gemini API Key missing");
        return null;
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a GTD (Getting Things Done) expert assistant. 
      Analyze the following inbox item and suggest how to process it.
      
      Item: "${content}"
      
      Provide a specific 'Next Action' (starting with a verb), a likely 'Project' it belongs to, and a 'Context' (like @calls, @computer, @errands).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedProject: { type: Type.STRING, description: "The project this task belongs to" },
                        suggestedContext: { type: Type.STRING, description: "The context required to perform the task" },
                        nextAction: { type: Type.STRING, description: "A concrete, physical next action step" },
                        reasoning: { type: Type.STRING, description: "Brief explanation of why this categorization was chosen" }
                    },
                    required: ["suggestedProject", "suggestedContext", "nextAction", "reasoning"]
                }
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as AISuggestion;
    } catch (error) {
        console.error("Error clarifying item with Gemini:", error);
        return null;
    }
};
