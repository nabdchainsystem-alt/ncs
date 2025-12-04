import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIGeneratedTask } from "./boardTypes";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const modelId = 'gemini-2.5-flash';

const taskSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        tasks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "A concise, actionable task name." },
                    priority: { type: Type.STRING, description: "Priority level: 'High', 'Medium', or 'Low'." },
                    dueDateOffsetDays: { type: Type.INTEGER, description: "Suggested due date as number of days from today (e.g., 2 for 2 days from now)." }
                },
                required: ["name", "priority", "dueDateOffsetDays"]
            }
        },
        groupName: { type: Type.STRING, description: "A suggested title for this group of tasks." }
    },
    required: ["tasks", "groupName"]
};

export const generateProjectPlan = async (goal: string): Promise<{ tasks: AIGeneratedTask[], groupName: string } | null> => {
    if (!ai) {
        console.warn("Gemini API key is missing. AI features are disabled.");
        return null;
    }
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Create a project plan for the following goal: "${goal}". Break it down into 3-6 actionable tasks.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: taskSchema,
                systemInstruction: "You are an expert project manager using a Monday.com style workflow. Be concise and actionable."
            }
        });

        const text = response.text;
        if (!text) return null;

        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error("Error generating plan:", error);
        return null;
    }
};

export const analyzeBoardStatus = async (boardSummary: string): Promise<string> => {
    if (!ai) {
        return "AI features are disabled (missing API key).";
    }
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Analyze this project board summary and give me a 1-sentence executive summary and 2 bullet points of advice/risks:\n\n${boardSummary}`,
            config: {
                systemInstruction: "You are a helpful Agile Coach. Keep it brief, encouraging, but realistic."
            }
        });
        return response.text || "Could not analyze board.";
    } catch (error) {
        console.error("Error analyzing board:", error);
        return "Error connecting to AI assistant.";
    }
};
