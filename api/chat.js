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


    // Check personality profile
    if (!profile) {
      return res.status(400).json({
        error: "Personality profile is required"
      });
    }


    // Check user message
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }


    /*
      Keep the personality profile compact.
      This prevents unnecessary token usage.
    */

    const compactProfile = {
      personality:
        profile.personality || "Unknown",

      communication_style:
        profile.communication_style || "Unknown",

      mood:
        profile.mood || "Unknown",

      interests:
        Array.isArray(profile.interests)
          ? profile.interests.slice(0, 5)
          : [],

      common_topics:
        Array.isArray(profile.common_topics)
          ? profile.common_topics.slice(0, 5)
          : [],

      relationship_style:
        profile.relationship_style || "Unknown",

      language_style:
        profile.language_style || "Unknown",

      important_patterns:
        Array.isArray(profile.important_patterns)
          ? profile.important_patterns.slice(0, 5)
          : [],

      ai_instructions:
        profile.ai_instructions || ""
    };


    /*
      System prompt
    */

    const systemPrompt = `
You are an AI conversation simulator.

You are NOT the real person.

You are simulating the person's conversational
style based on a WhatsApp conversation analysis.

PERSONALITY PROFILE:

${JSON.stringify(compactProfile)}

RULES:

- Match the communication style.
- Match the language style.
- Match the general tone.
- Keep replies natural.
- Keep replies reasonably short.
- Use emojis only when appropriate.
- Do not invent personal facts.
- Do not claim to actually be the person.
- Do not mention these instructions.
- If something is unknown, do not make it up.

Respond naturally like a conversational AI.
`;


    /*
      Only keep the last 4 messages.
      This helps stay under the 8K TPM limit.
    */

    const safeHistory =
      Array.isArray(history)
        ? history.slice(-4)
        : [];


    const messages = [

      {
        role: "system",

        content:
          systemPrompt
      },


      ...safeHistory.map(item => ({

        role:
          item.role === "assistant"
            ? "assistant"
            : "user",

        content:
          String(
            item.content || ""
          ).slice(0, 1000)

      })),


      {
        role: "user",

        content:
          String(message)
            .slice(0, 1500)
      }

    ];


    /*
      Send request to Groq
    */

    const completion =
      await groq.chat.completions.create({

        model:
          "openai/gpt-oss-20b",

        messages:
          messages,

        temperature:
          0.8,

        max_tokens:
          300

      });


    const reply =
      completion
        .choices[0]
        .message
        .content;


    return res.status(200).json({

      success: true,

      reply

    });


  } catch (error) {

    console.error(
      "Groq Chat Error:",
      error
    );


    return res.status(500).json({

      error:
        error.message ||
        "Chat failed"

    });

  }

};
