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

    /*
      8K TPM limit காரணமாக
      chat size-ஐ குறைக்கிறோம்.
    */

    const limitedChat =
      chat.slice(-7000);


    const prompt = `
Analyze this WhatsApp conversation.

Return JSON only:

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

Rules:
- Use only information present in the chat.
- Do not invent facts.
- Do not diagnose.
- Unknown if unclear.
- Keep every field short.

CHAT:

${limitedChat}
`;


    const completion =
      await groq.chat.completions.create({

        model:
          "openai/gpt-oss-20b",

        messages: [

          {
            role: "system",

            content:
              "Analyze conversations and return valid JSON only."
          },

          {
            role: "user",

            content: prompt
          }

        ],

        temperature: 0.3,

        max_tokens: 700

      });


    const result =
      completion
        .choices[0]
        .message
        .content;


    let profile;


    try {

      profile =
        JSON.parse(result);

    } catch {

      profile = {

        personality: result,

        communication_style:
          "Unknown",

        mood:
          "Unknown",

        interests: [],

        common_topics: [],

        relationship_style:
          "Unknown",

        language_style:
          "Unknown",

        important_patterns: [],

        ai_instructions:
          result

      };

    }


    return res.status(200).json({

      success: true,

      profile

    });


  } catch (error) {

    console.error(
      "Analysis error:",
      error
    );

    return res.status(500).json({

      error:
        error.message ||
        "Analysis failed"

    });

  }

};
