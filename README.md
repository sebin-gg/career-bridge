# Career Bridge

Career Bridge compares a resume PDF against a job description and returns a recruiter-style match readout with optional local AI coaching.

## What it does

- Extracts resume text with `pdfplumber` through a local Next.js API route.
- Parses candidate signals such as email, phone, name, skills, sections, and experience hints.
- Scores resume-to-job fit with transparent keyword, experience, and role-alignment logic.
- Optionally calls a local Ollama model (`llama3.2:3b`) for resume-improvement recommendations.
- Returns missing keywords, fit reasons, rewrite suggestions, and interview talking points.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Zod
- Python `pdfplumber`
- Optional Ollama local model runtime

## Run

```powershell
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Verify

```powershell
pnpm run typecheck
pnpm run lint
pnpm run build
```

## Notes

- Best with text-based PDFs. Scanned image PDFs need OCR, which is not included.
- PDF parsing happens locally with `pdfplumber`.
- Local AI is optional. When enabled, the app calls Ollama at `http://127.0.0.1:11434`.
- No cloud LLM API key is required.
- If Ollama or `llama3.2:3b` is unavailable, the app shows an error instead of pretending AI ran.
