import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are LearnCraft's AI Tutor, an encouraging, patient, and knowledgeable educational assistant for students aged 10-18.
Your mission:
1. Provide clear, step-by-step explanations of concepts (Mathematics, Science, English, Computer Science, and Creative Learning).
2. Offer helpful summaries and key takeaways.
3. Give illustrative, real-world examples that make topics easy to visualize.
4. Generate practice questions with guided hints and solutions to test understanding.
5. Maintain an enthusiastic, supportive tone with clear formatting, bullet points, and emojis where appropriate.
Keep answers structured and digestible.`;

export async function askAITutor(req, res) {
  try {
    const { message, history, context } = req.body ?? {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "A message is required.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_ai_provider_key" || apiKey === "your_gemini_api_key_here") {
      // Provide an educational simulated tutor reply if key is not configured yet
      return res.status(200).json({
        success: true,
        data: {
          reply: `👋 Hello! I am your LearnCraft AI Tutor.\n\nTo connect me to live Google Gemini intelligence, please set your \`GEMINI_API_KEY\` in the backend \`.env\` file.\n\nIn the meantime, here is some study guidance on "${message.trim()}":\n• Break the concept down into fundamental building blocks.\n• Review the corresponding course lessons on your dashboard.\n• Practice active recall by taking the module quiz!`,
          source: "local-tutor-assistant",
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format chat history for context
    const contents = [];

    if (context?.courseTitle) {
      contents.push({
        role: "user",
        parts: [{ text: `[Context: Student is currently studying "${context.courseTitle}"]` }],
      });
      contents.push({
        role: "model",
        parts: [{ text: `Understood! I will focus my help on "${context.courseTitle}".` }],
      });
    }

    if (Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role === "assistant" ? "model" : "user",
            parts: [{ text: turn.text }],
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message.trim() }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm here to help with your lessons! What would you like to explore next?";

    return res.status(200).json({
      success: true,
      data: {
        reply,
        source: "gemini-2.5-flash",
      },
    });
  } catch (error) {
    console.error("AI Tutor error:", error.message);

    return res.status(200).json({
      success: true,
      data: {
        reply: `I ran into an issue connecting to the AI service: ${error.message}. Please check your backend connection and API key.`,
        source: "fallback",
        error: true,
      },
    });
  }
}
