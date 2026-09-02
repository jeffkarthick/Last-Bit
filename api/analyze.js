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
    const { chat } = req.body;

    if (!chat || !chat.trim()) {
      return res.status(400).json({
        error: "Chat text is required"
      });
    }

    // Keep the input safely below an 8K context window.
    const limitedChat = chat.slice(-22000);

    const prompt = `
Analyze the following WhatsApp conversation.

Create a compact personality profile based ONLY on the conversation.

Return JSON with these fields:

{
  "personality": "",
  "communication_style": "",
  "mood": "",
  "interests": [],
  "common_topics": [],
  "relationship_style": "",
  "language_style": "",
  "important_patterns": [],
  "ai_instructions": ""
}

Do not invent facts.
Do not diagnose mental health conditions.
If something cannot be determined, say "Unknown".

Conversation:

${limitedChat}
`;

    const completion = await 
      model: "openai/gpt-oss-20b", ,
      messages: [
        {
          role: "system",
          content:
            "You are a careful conversation-analysis AI. Return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 1500
    });

    const result = completion.choices[0].message.content;

    let profile;

    try {
      profile = JSON.parse(result);
    } catch {
      profile = {
        personality: result,
        communication_style: "Unknown",
        mood: "Unknown",
        interests: [],
        common_topics: [],
        relationship_style: "Unknown",
        language_style: "Unknown",
        important_patterns: [],
        ai_instructions: result
      };
    }

    return res.status(200).json({
      success: true,
      profile
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "AI analysis failed"
    });
  }
};
