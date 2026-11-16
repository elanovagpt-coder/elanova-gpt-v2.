
const { InferenceClient } = require("@huggingface/inference");

const MAX_PROMPT_LENGTH = 2000;

// Limite simple par instance du serveur.
// Ce n'est pas une protection globale contre les abus.
const recentRequests = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 2;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  if (!process.env.HF_TOKEN) {
    return res.status(503).json({
      error: "Image service is not configured."
    });
  }

  const prompt = req.body?.prompt;

  if (
    typeof prompt !== "string" ||
    !prompt.trim() ||
    prompt.length > MAX_PROMPT_LENGTH
  ) {
    return res.status(400).json({
      error: "Enter a description under 2000 characters."
    });
  }

  // Limitation indicative par IP.
  // Pour une protection fiable en production,
  // utiliser un stockage partagé et une authentification.
  const ip = String(
    req.headers["x-forwarded-for"] || "unknown"
  ).split(",")[0].trim();

  const now = Date.now();
  const previous = recentRequests.get(ip) || [];
  const active = previous.filter(
    time => now - time < WINDOW_MS
  );

  if (active.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Image limit reached. Please try again later."
    });
  }

  active.push(now);
  recentRequests.set(ip, active);

  // Nettoyage de la mémoire.
  if (recentRequests.size > 1000) {
    for (const [key, times] of recentRequests) {
      if (times.every(time => now - time >= WINDOW_MS)) {
        recentRequests.delete(key);
      }
    }
  }

  try {
    const client = new InferenceClient(process.env.HF_TOKEN);

    const imageBlob = await client.textToImage({
      model: "black-forest-labs/FLUX.1-dev",
      inputs: prompt.trim()
    });

    const contentType = imageBlob.type || "image/png";

    if (![
      "image/png",
      "image/jpeg",
      "image/webp"
    ].includes(contentType)) {
      throw new Error("Unsupported image format.");
    }

    const buffer = Buffer.from(
      await imageBlob.arrayBuffer()
    );

    if (buffer.length > 4 * 1024 * 1024) {
      return res.status(502).json({
        error: "Generated image is too large."
      });
    }

    const image = `data:${contentType};base64,${buffer.toString("base64")}`;

    return res.status(200).json({ image });

  } catch (error) {
    console.error(
      "ELANOVA image generation error:",
      error.message
    );

    return res.status(503).json({
      error: "Image generation unavailable. Check your Hugging Face credits and model access."
    });
  }
};
