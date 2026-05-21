// ─── Gemini API Configuration ───────────────────────────────────────────────
// Replace the value below with your actual Gemini API key.
// You can get one free at: https://aistudio.google.com/apikey
//
// IMPORTANT: Do NOT commit your real key to a public repo.
// For production builds, set EXPO_PUBLIC_GEMINI_API_KEY in your EAS environment variables.

const GEMINI_API_KEY =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    'YOUR_GEMINI_API_KEY_HERE'; // ← paste your key here

export default GEMINI_API_KEY;
