
import { GoogleGenAI } from "@google/genai";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
export const getGeminiResponse = async (prompt: string, systemInstruction: string = "You are the ChronoScribe, keeper of knowledge for the DC Universe Online league 'The Ashen Veil'. You provide expert advice on builds, raids, farming, and lore.") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    // The response object features a text property (not a method)
    return response.text || "I cannot see the path clearly at this moment...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The void whispers of an error in our connection.";
  }
};

export const analyzeImageStyle = async (imageSource: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let parts: any[] = [];
    const baseInstruction = "Analyze the visual theme, color palette, lighting style, and overall aesthetic of this image. Provide 15 descriptive keywords suitable for generating matching game UI assets. Include details like lighting color (e.g., 'amber glow'), material properties (e.g., 'brushed obsidian', 'glowing crystalline'), and overall vibe (e.g., 'gritty noir', 'neon cyberpunk').";

    if (imageSource.startsWith('data:')) {
      const splitParts = imageSource.split(',');
      const mimeType = splitParts[0].split(';')[0].split(':')[1];
      const base64Data = splitParts[1];
      parts = [
        { text: baseInstruction },
        { inlineData: { mimeType, data: base64Data } }
      ];
    } else {
      parts = [
        { text: `${baseInstruction} Image Source URL: ${imageSource}` }
      ];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
    });
    return response.text || "mystical, high-fidelity, superhero game style, cinematic lighting";
  } catch (error) {
    console.error("Style Analysis Error:", error);
    return "cinematic, heroic, detailed, high-tech";
  }
};

export const transformImageWithAI = async (prompt: string, base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Transform this character/image into a high-quality comic book style illustration based on the following instructions: ${prompt}. Return only the image.` },
          { inlineData: { mimeType: 'image/png', data: base64Image } }
        ]
      },
    });

    // Iterate through all parts to find the image part for nano banana series models
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("AI Transformation Error:", error);
    return null;
  }
};

export const generateImageFromText = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};
