import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Task, Status } from "../types";

const apiKey = process.env.API_KEY || '';
// Safety check for missing API key handled in UI, but we initialize safely.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateTaskSummary = async (tasks: Task[]): Promise<string> => {
  if (!ai) return "API Key is missing. Please check your configuration.";

  const taskListString = tasks.map(t => 
    `- ${t.title} (Status: ${t.status}, Priority: ${t.priority})`
  ).join('\n');

  const prompt = `
    You are an AI project manager assistant called "ClickUp Brain". 
    Analyze the following tasks and provide a concise, professional summary of the current workload.
    Identify potential bottlenecks based on priority and status.
    Keep it under 100 words.

    Tasks:
    ${taskListString}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while analyzing your tasks.";
  }
};

export const generateSubtasks = async (taskTitle: string): Promise<string[]> => {
  if (!ai) return ["API Key missing"];

  const prompt = `
    I have a task titled: "${taskTitle}".
    Generate a list of 3-5 actionable subtasks to complete this main task.
    Return ONLY the subtasks as a JSON array of strings. Do not include markdown formatting like \`\`\`json.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return ["Failed to generate subtasks."];
  }
};

export const chatWithBrain = async (message: string, contextTasks: Task[]): Promise<string> => {
  if (!ai) return "API Key is missing.";

  const context = JSON.stringify(contextTasks.map(t => ({ title: t.title, status: t.status })));
  
  const prompt = `
    Context (Current Tasks): ${context}
    
    User Question: ${message}
    
    Answer as "ClickUp Brain", a helpful productivity assistant. Be concise and helpful.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the brain right now.";
  }
};
