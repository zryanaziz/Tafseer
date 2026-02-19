
import { GoogleGenAI } from "@google/genai";

/**
 * Generates AI insights for a given Quranic verse based on its text, translation, and classical tafseer.
 * Uses gemini-3-flash-preview for efficient text analysis.
 * Now requests the response in Kurdish Sorani.
 */
export const getAIInsights = async (verseText: string, translation: string, contextTafseer: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Context:
    Verse (Arabic): ${verseText}
    Translation: ${translation}
    User's Interpretation/Notes: ${contextTafseer.substring(0, 1000)}...

    Task:
    Provide a concise, 3-point AI analysis in Kurdish Sorani (using Arabic script) focusing on:
    1. Linguistic nuances of specific Arabic keywords used in this verse.
    2. Historical context or "Sabab al-Nuzul" if applicable.
    3. Practical implementation/wisdom for a modern person today.
    
    IMPORTANT: The entire response MUST be in Kurdish Sorani.
    Format the response in clear Markdown. Keep it strictly focused on the Tafseer.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text || "هیچ زانیارییەک دروست نەکرا.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "ناتوانرێت زانیاری دروست بکرێت لەم ساتەدا.";
  }
};
