import { z } from "zod";

import { getOllamaRecommendations, OLLAMA_MODEL } from "@/lib/ai/ollama";
import { analyzeResumeAgainstJob } from "@/lib/analysis/scoring";

const requestSchema = z.object({
  resumeText: z.string().min(120),
  jobDescription: z.string().min(120),
  useLocalAi: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = analyzeResumeAgainstJob(body.resumeText, body.jobDescription);

    if (!body.useLocalAi) {
      return Response.json(result);
    }

    try {
      const aiRecommendations = await getOllamaRecommendations({
        resumeText: body.resumeText,
        jobDescription: body.jobDescription,
        baseAnalysis: result,
      });

      return Response.json({
        ...result,
        aiModel: OLLAMA_MODEL,
        aiRecommendations,
      });
    } catch (aiError) {
      return Response.json(
        {
          message:
            aiError instanceof Error
              ? aiError.message
              : "Local AI unavailable. Check Ollama and try again.",
        },
        { status: 503 },
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          message:
            "Resume text and job description must both be detailed enough to analyze.",
        },
        { status: 400 },
      );
    }

    return Response.json(
      { message: "Analysis failed. Check the input and try again." },
      { status: 500 },
    );
  }
}
