# Kaggle Project: Career Bridge

## Chosen Topic

Career Bridge: a resume-to-job fit analyzer for job seekers who need quick, specific guidance before applying.

## Why This Was The Recommended Path

- Focused scope: one resume PDF and one job description.
- Easy walkthrough: upload, paste, analyze.
- No external account, cloud model key, database, or background worker needed.
- Clear value: fit score, missing keywords, rewrite suggestions, and interview prep.
- Practical enough for a capstone writeup without requiring a large dataset.

## User Flow

1. User uploads a text-based resume PDF.
2. Local API extracts text with `pdfplumber`.
3. User pastes a job description.
4. API validates both inputs with Zod.
5. Analyzer extracts resume/profile signals and job keywords.
6. UI renders score, fit reasons, gaps, rewrite suggestions, and talking points.
7. Optional: user enables Local AI and Ollama returns extra coaching bullets.

## Architecture

- `src/app/career-bridge-client.tsx`: interactive upload and results UI.
- `src/app/api/extract-pdf/route.ts`: PDF upload endpoint.
- `scripts/extract_pdf_text.py`: `pdfplumber` extraction script.
- `src/app/api/analyze/route.ts`: typed analysis endpoint.
- `src/lib/ai/ollama.ts`: local Ollama model integration.
- `src/lib/analysis/resume.ts`: resume profiling.
- `src/lib/analysis/keywords.ts`: keyword normalization and extraction.
- `src/lib/analysis/scoring.ts`: transparent scoring and recommendations.

## Product Constraints

- Text-based PDFs only; scanned PDFs need OCR in a future version.
- Single resume and single job description only.
- Base scoring is transparent for predictable behavior.
- Local AI requires Ollama and the `llama3.2:3b` model.
- No account system, saved history, or database in v1.

## Demo Script

1. Start with `pnpm dev`.
2. Upload a text resume PDF.
3. Paste the sample job description or a real posting.
4. Click `Analyze Match`.
5. Optionally enable Local AI. If Ollama is unavailable, use the setup button or show the error state.
6. Explain the score buckets and show how missing keywords become resume-edit tasks.

## Verification

The project should pass:

```powershell
pnpm run typecheck
pnpm run lint
pnpm run build
```
