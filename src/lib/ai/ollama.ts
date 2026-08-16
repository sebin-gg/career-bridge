import type { AnalysisResult } from "@/lib/analysis/types";

const OLLAMA_URL = "http://127.0.0.1:11434";
export const OLLAMA_MODEL = "llama3.2:3b";

type OllamaGenerateResponse = {
  response?: string;
};

export async function getOllamaRecommendations({
  resumeText,
  jobDescription,
  baseAnalysis,
}: {
  resumeText: string;
  jobDescription: string;
  baseAnalysis: AnalysisResult;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        prompt: [
          "You are a concise career coach.",
          "Compare this resume to this job description.",
          "Return exactly five short, specific resume-improvement bullets.",
          "Do not include intro text.",
          "",
          `Candidate: ${baseAnalysis.resumeProfile.candidateName}`,
          `Base score: ${baseAnalysis.score}`,
          `Missing keywords: ${baseAnalysis.missingKeywords.join(", ")}`,
          "",
          "Resume:",
          resumeText.slice(0, 5000),
          "",
          "Job description:",
          jobDescription.slice(0, 3000),
        ].join("\n"),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Ollama model is not ready.");
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    const raw = data.response?.trim();
    if (!raw) {
      throw new Error("Ollama returned an empty response.");
    }

    return raw
      .split(/\n+/)
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 5);
  } catch {
    throw new Error(
      `Local AI unavailable. Install/start Ollama and pull ${OLLAMA_MODEL}, then try again.`,
    );
  } finally {
    clearTimeout(timeout);
  }
}
