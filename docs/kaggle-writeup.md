# Career Bridge: Resume-To-Role Fit Analyzer

## Summary

Career Bridge helps a job seeker compare one resume against one job description. The app accepts a resume PDF, extracts text locally with `pdfplumber`, accepts a pasted job description, and returns a recruiter-style readout with a match score, fit reasons, missing keywords, rewrite suggestions, interview talking points, and optional local AI recommendations.

## Problem

Job seekers often apply with generic resumes because it is hard to quickly see what a job post is actually asking for. The result is wasted applications and weak tailoring. Career Bridge turns that vague matching problem into a concrete checklist.

## Solution

The product flow is direct:

1. Upload one text-based resume PDF.
2. Paste one job description.
3. Run transparent matching analysis.
4. Optionally enable local AI coaching through Ollama.
5. Review score, strengths, gaps, suggested resume edits, and AI-generated improvement bullets.

This keeps the tool easy to operate while still producing specific guidance a job seeker can act on immediately.

## How It Works

The app sends the uploaded PDF to a local Next.js API route. A Python `pdfplumber` script extracts resume text and preserves useful line breaks for name and section parsing. The analyzer normalizes text, extracts canonical skills and job keywords, builds a lightweight resume profile, scores overlap and experience signals, then generates actionable recommendations.

If the user enables Local AI, the analysis route calls Ollama on `localhost` with `llama3.2:3b`. The model receives the resume text, job description, and base score context, then returns five concise improvement bullets. If Ollama or the model is unavailable, the app shows a setup error instead of silently falling back.

The score is split into:

- Keyword overlap
- Experience signal
- Role alignment

The output is designed for action, not just evaluation. A user can immediately update resume bullets based on missing terms and suggested phrasing.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Zod validation
- Python `pdfplumber`
- Ollama with `llama3.2:3b` for optional local AI recommendations

No cloud LLM API, database, or hosted service is required.

## Agent Use

Agent-assisted development was useful for reducing scope, comparing possible capstone ideas, selecting the smallest useful product, and turning that plan into a working implementation. The strongest agent contribution was scope control: avoiding broad career coaching features and building a specific resume-to-job analyzer instead.

## What Works

- Local PDF text extraction with `pdfplumber`.
- Server-side input validation.
- Transparent matching and scoring.
- Optional local AI coaching through Ollama.
- Clear UI for fit reasons, gaps, rewrites, and interview prep.
- Production build passes.

## Limitations

- Scanned PDFs are not supported because OCR is outside the current build.
- The base analyzer is keyword-driven, so Local AI is used to improve coaching quality when available.
- It handles one resume and one job description at a time.

## Future Work

- OCR for scanned resumes.
- Deeper local-model rewrite generation.
- Saved comparisons and progress tracking.
- Exportable action plan.
- Support for multiple job descriptions.

## Why This Project Fits The Capstone

Career Bridge is useful and easy to evaluate. It shows a complete path from messy user input to structured analysis, local AI assistance, and practical recommendations while keeping user data on the machine.
