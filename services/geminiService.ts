import { GoogleGenAI, Type, Schema } from "@google/genai";
import { WaveConfig } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Cache the model instance if possible or just create new one
const modelId = 'gemini-3-flash-preview';

const waveSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    enemyCount: { type: Type.INTEGER, description: "Number of enemies to spawn" },
    enemySpeed: { type: Type.NUMBER, description: "Speed of enemies (0.1 to 2.0)" },
    enemyHp: { type: Type.INTEGER, description: "HP of enemies (10 to 100)" },
    spawnInterval: { type: Type.INTEGER, description: "Milliseconds between spawns" },
    flavorText: { type: Type.STRING, description: "A short, taunting message from the AI Director about the next wave" }
  },
  required: ["enemyCount", "enemySpeed", "enemyHp", "spawnInterval", "flavorText"],
};

export const generateWaveConfig = async (
  currentWave: number,
  playerScore: number,
  playerHealth: number
): Promise<WaveConfig> => {
  if (!apiKey) {
    console.warn("No API Key found. Returning default wave config.");
    return {
      enemyCount: 3 + currentWave,
      enemySpeed: 0.5 + (currentWave * 0.1),
      enemyHp: 20,
      spawnInterval: 2000,
      flavorText: "Simulated Director: Prepare yourself."
    };
  }

  try {
    const prompt = `
      You are the AI Director of a 2D shooter game.
      Current Wave: ${currentWave}.
      Player Score: ${playerScore}.
      Player Health Remaining: ${playerHealth}.

      Design the next wave configuration to challenge the player appropriately.
      If the player is doing well (high score, high health), make it harder.
      If they are struggling, give them a fighting chance but keep it intense.
      Provide a short 'flavorText' to display to the player (max 10 words).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: waveSchema,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Gemini");

    return JSON.parse(jsonText) as WaveConfig;
  } catch (error) {
    console.error("Gemini AI Director failed:", error);
    // Fallback
    return {
      enemyCount: 3 + currentWave,
      enemySpeed: 0.5 + (currentWave * 0.1),
      enemyHp: 20 + (currentWave * 5),
      spawnInterval: Math.max(500, 3000 - (currentWave * 200)),
      flavorText: "Director Offline. Protocol: ESCALATE."
    };
  }
};
