const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      profile,
      message,
      history = []
    } = req.body;

    if (!profile || !message) {
      return res.status(400).json({
        error: "Profile and message are required"
      });
    }

    const systemPrompt = `
You are an AI simulation based on a WhatsApp conversation.

IMPORTANT:
You are NOT the real person.
Do not claim to actually be that person.
You are only simulating their conversational style based on the provided analysis.

PERSONALITY PROFILE:

${JSON.stringify(profile)}

Respond naturally according to the profile.

Rules:
- Match the communication style.
- Match the language style.
- Match the general tone.
- Use similar levels of casual/formal language.
- Do not invent personal facts.
- If you don't know something, say so naturally.
- Keep replies conversational and reasonably short.
`;

    const safeHistory = Array.isArray(history)
      ? history.slice(-8)
      : [];

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...safeHistory.map(item => ({
        role: item.role === "assistant"
          ? "assistant"
          : "user",
        content: String(item.content).slice(0, 2000)
      })),
      {
        role: "user",
        content: String(message).slice(0, 3000)
      }
    ];

    const completion = await 
      model: "openai/gpt-oss-20b", 
        
      messages,
      temperature: 0.8,
      max_tokens: 500
    });

    const reply =
      completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      reply
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Chat failed"
    });
  }
};
