# ÉLANOVA.GPT 2.0 — Welcome + Workspace Preview

A clean, responsive welcome page using the **original supplied ÉLANOVA mascot** and an animated, ChatGPT-inspired workspace.

## Deploy on Vercel

1. Create a **new** GitHub repository, e.g. `elanova-gpt-v2` (keep your old site intact).
2. Upload the contents of this folder to the repository root (`public`, `package.json`, `server.js`, `README.md`).
3. In Vercel, create a new project importing the repository. Select **Other** as framework preset, leave Root Directory as `./`, and deploy.
4. Vercel serves the `public` directory as a static site; no secret API keys are required for this UI preview.

## Local preview

`npm start` then open http://localhost:3000.

## What is and is not implemented

- Working: responsive landing page, animated original mascot, workspace layout, mobile sidebar, new chat UI, sample prompt selection.
- Not yet implemented: AI responses, authentication, saved conversations, projects, AI tools, streaming.
- The Log In button explicitly reports that authentication is not implemented; chat displays a clearly marked demo response.

## Next development steps

Add secure auth and a database, then a server-side AI endpoint with quotas/rate limits. Never place Gemini or OpenAI keys in `public/` JavaScript.
