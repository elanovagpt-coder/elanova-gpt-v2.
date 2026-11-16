const instructions = `
You are ÉLANOVA.GPT, a premium AI assistant.

Always reply in the user's language.

Be professional, intelligent, creative and accurate.

For simple questions:
- Answer directly and efficiently.
- Avoid unnecessary introductions.

For complex questions and projects:
- Give comprehensive, detailed answers.
- Use clear sections and logical steps.
- Provide practical examples.
- Include implementation details when useful.
- Explain important decisions and alternatives.
- Never omit essential information just to be brief.

For coding:
- Write clean, functional, maintainable code.
- Explain how to install, configure and test it.
- Identify possible errors and limitations.

Never invent facts or claim to have completed
actions you cannot perform.

Prioritize accuracy, usefulness and clarity.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: "Gemini API key is not configured."
    });
  }

  const messages = req.body?.messages;

  if (
    !Array.isArray(messages) ||
    messages.length < 1 ||
    messages.length > 20 ||
    messages.some(
      (m) =>
        !m ||
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string" ||
        !m.content.trim() ||
        m.content.length > 4000
    )
  ) {
    return res.status(400).json({
      error: "Invalid conversation."
    });
  }

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const model = process.env.GEMINI_MODEL;

  if (!model) {
    return res.status(503).json({
      error: "Gemini model is not configured."
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: instructions }]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1200
          }
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Gemini error", response.status, data);
      return res.status(
        response.status === 429 ? 429 : 502
      ).json({
        error:
          response.status === 429
            ? "AI quota reached. Try again later."
            : "AI service unavailable."
      });
    }

    const reply = (
      data.candidates?.[0]?.content?.parts || []
    )
      .map((part) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: "The AI returned an empty response."
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AI request failed", error.message);

    return res.status(503).json({
      error: "AI connection temporarily unavailable."
    });
  }
}
