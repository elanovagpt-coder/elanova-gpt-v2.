
import { InferenceClient } from "@huggingface/inference";

const MODEL = "black-forest-labs/FLUX.1-dev";
const MAX_PROMPT_LENGTH = 2000;
const MAX_REQUESTS = 2;
const WINDOW_MS = 60 * 60 * 1000;

const recentRequests = new Map();

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  if (!process.env.HF_TOKEN) {
    return res.status(503).json({
      error: "Hugging Face is not configured."
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

  // Basic per-instance limit.
  // This does not provide global rate limiting.
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
      error: "Image limit reached. Try again later."
    });
  }

  active.push(now);
  recentRequests.set(ip, active);

  if (recentRequests.size > 1000) {
    recentRequests.clear();
  }

  try {
    const client = new InferenceClient(process.env.HF_TOKEN);

    const imageBlob = await client.textToImage({
      model: MODEL,
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

    return res.status(200).json({
      image: `data:${contentType};base64,${buffer.toString("base64")}`
    });

  } catch (error) {
    console.error("Image generation error:", error.message);

    return res.status(503).json({
      error: "Image generation unavailable. Check Hugging Face credits and model access."
    });
  }
}

