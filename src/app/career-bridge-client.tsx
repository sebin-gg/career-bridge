"use client";

import { useState, type ChangeEvent } from "react";

import type { AnalysisResult } from "@/lib/analysis/types";

const sampleJobDescription = `We are hiring a product-minded frontend engineer to build polished user workflows in React and Next.js. You will partner with design, own features end to end, ship accessible interfaces, and work closely with product managers. Strong TypeScript, API integration, testing, communication, and stakeholder alignment are required. Experience with analytics, experimentation, and performance tuning is preferred.`;

type FormState = {
  jobDescription: string;
  resumeName: string;
  resumeText: string;
  useLocalAi: boolean;
};

const initialState: FormState = {
  jobDescription: sampleJobDescription,
  resumeName: "",
  resumeText: "",
  useLocalAi: false,
};

async function runAnalysis(payload: {
  resumeText: string;
  jobDescription: string;
  useLocalAi: boolean;
}) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as AnalysisResult | { message: string };

  if (!response.ok) {
    throw new Error("message" in data ? data.message : "Analysis failed.");
  }

  return data as AnalysisResult;
}

async function extractResumeText(file: File) {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch("/api/extract-pdf", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as { text: string } | { message: string };

  if (!response.ok) {
    throw new Error("message" in data ? data.message : "Could not read the PDF.");
  }

  return "text" in data ? data.text : "";
}

export function CareerBridgeClient() {
  const [formState, setFormState] = useState(initialState);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPreparingAi, setIsPreparingAi] = useState(false);

  async function handleResumeChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setAnalysis(null);

    try {
      const resumeText = await extractResumeText(file);
      setFormState((current) => ({
        ...current,
        resumeName: file.name,
        resumeText,
      }));
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Could not read the PDF.";
      setError(message);
    }
  }

  async function handleAnalyze() {
    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await runAnalysis({
        resumeText: formState.resumeText,
        jobDescription: formState.jobDescription,
        useLocalAi: formState.useLocalAi,
      });
      setAnalysis(result);
    } catch (analysisError) {
      const message =
        analysisError instanceof Error
          ? analysisError.message
          : "Analysis failed.";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const canAnalyze =
    formState.resumeText.trim().length >= 120 &&
    formState.jobDescription.trim().length >= 120 &&
    !isAnalyzing;

  async function handlePrepareAi() {
    const confirmed = window.confirm(
      "Install or prepare Ollama locally and pull llama3.2:3b? This can download software/model files and may take time.",
    );

    if (!confirmed) {
      setError("Local AI setup cancelled. Enable Ollama manually or analyze without Local AI.");
      return;
    }

    setError(null);
    setIsPreparingAi(true);

    try {
      const response = await fetch("/api/ollama/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = (await response.json()) as { message: string };

      if (!response.ok) {
        throw new Error(data.message);
      }

      setError(data.message);
    } catch (setupError) {
      setError(
        setupError instanceof Error
          ? setupError.message
          : "Could not prepare Ollama.",
      );
    } finally {
      setIsPreparingAi(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#08111f_0%,#0f172a_45%,#172033_100%)] text-stone-50">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.5em] text-cyan-200">
                Career Bridge
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Upload one resume PDF. Paste one job post. Get a recruiter-style fit readout.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Resume parsing, role-fit scoring, and optional local AI coaching
                in one private workflow.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.08] p-4">
                <p className="text-sm text-cyan-100">PDF parsing</p>
                <p className="mt-2 text-2xl font-semibold">pdfplumber</p>
              </div>
              <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.08] p-4">
                <p className="text-sm text-emerald-100">Local AI</p>
                <p className="mt-2 text-2xl font-semibold">Ollama</p>
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center gap-3 text-sm text-slate-200">
                    <input
                      checked={formState.useLocalAi}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          useLocalAi: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-cyan-200"
                      type="checkbox"
                    />
                    Use local AI coaching with Ollama
                  </label>
                  <button
                    type="button"
                    onClick={handlePrepareAi}
                    disabled={isPreparingAi}
                    className="rounded-full border border-cyan-200/30 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-200/10 disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    {isPreparingAi ? "Preparing..." : "Install / Prepare Ollama"}
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Local AI is optional. If enabled, the app calls `llama3.2:3b`
                  through Ollama on this machine. If Ollama is missing, the app
                  shows an error instead of silently falling back.
                </p>
              </div>
              <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.08] p-4">
                <p className="text-sm text-amber-100">Output</p>
                <p className="mt-2 text-2xl font-semibold">Actionable</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-slate-950/25 backdrop-blur">
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <label className="rounded-3xl border border-dashed border-white/20 bg-slate-950/50 p-5">
                  <span className="text-sm uppercase tracking-[0.25em] text-slate-300">
                    Resume PDF
                  </span>
                  <input
                    className="mt-4 block w-full cursor-pointer text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-950"
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeChange}
                  />
                  <p className="mt-4 text-sm text-slate-400">
                    {formState.resumeName
                      ? `Loaded: ${formState.resumeName}`
                      : "Server extraction uses pdfplumber for text-based PDFs."}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Extracted text: {formState.resumeText.length} chars
                  </p>
                </label>

                <label className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                  <span className="text-sm uppercase tracking-[0.25em] text-slate-300">
                    Job Description
                  </span>
                  <textarea
                    value={formState.jobDescription}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        jobDescription: event.target.value,
                      }))
                    }
                    className="mt-4 h-56 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="rounded-full bg-cyan-200 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Match"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormState(initialState);
                    setAnalysis(null);
                    setError(null);
                  }}
                  className="rounded-full border border-white/15 px-6 py-3 text-sm text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Reset
                </button>
              </div>

              {error ? (
                <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur">
            {analysis ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                        Match Score
                      </p>
                      <h2 className="mt-3 text-5xl font-semibold">{analysis.score}</h2>
                    </div>
                    <span className="rounded-full bg-emerald-200 px-4 py-2 text-sm font-semibold text-slate-950">
                      {analysis.readiness}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {analysis.summary}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {analysis.buckets.map((bucket) => (
                    <div
                      key={bucket.label}
                      className="rounded-3xl border border-white/10 bg-slate-900/75 p-4"
                    >
                      <p className="text-sm text-slate-400">{bucket.label}</p>
                      <p className="mt-2 text-3xl font-semibold">{bucket.score}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/75 p-5">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                    Candidate Snapshot
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Name</p>
                      <p className="mt-1 text-lg">{analysis.resumeProfile.candidateName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Experience Signal</p>
                      <p className="mt-1 text-lg">
                        {analysis.resumeProfile.yearsOfExperience || 0} years
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <ResultCard
                    title="Top fit reasons"
                    items={analysis.fitReasons}
                    tone="cyan"
                  />
                  <ResultCard
                    title="Missing keywords"
                    items={analysis.missingKeywords}
                    tone="amber"
                  />
                  <ResultCard
                    title="Rewrite suggestions"
                    items={analysis.rewriteSuggestions}
                    tone="emerald"
                  />
                  <ResultCard
                    title="Interview talking points"
                    items={analysis.interviewTalkingPoints}
                    tone="rose"
                  />
                  {analysis.aiRecommendations?.length ? (
                    <ResultCard
                      title={`Local AI recommendations (${analysis.aiModel})`}
                      items={analysis.aiRecommendations}
                      tone="cyan"
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[32rem] flex-col justify-between rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.04] p-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                    Result Panel
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold">
                    Recruiter-style readout waits here.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                    After analysis, this panel shows score, overlap, missing terms,
                    and suggested bullet rewrites.
                  </p>
                </div>

                <div className="grid gap-3">
                  {[
                    "Score based on keyword overlap, experience signal, and role alignment",
                    "Missing keyword callouts for fast resume edits",
                    "Interview prep prompts pulled from your strongest lines",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-slate-900/75 px-4 py-4 text-sm text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function ResultCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "cyan" | "amber" | "emerald" | "rose";
}) {
  const toneClasses = {
    cyan: "border-cyan-300/20 bg-cyan-300/[0.07]",
    amber: "border-amber-300/20 bg-amber-300/[0.07]",
    emerald: "border-emerald-300/20 bg-emerald-300/[0.07]",
    rose: "border-rose-300/20 bg-rose-300/[0.07]",
  };

  return (
    <div className={`rounded-3xl border p-5 ${toneClasses[tone]}`}>
      <p className="text-sm uppercase tracking-[0.25em] text-slate-300">{title}</p>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-100">
        {items.map((item) => (
          <li key={item} className="rounded-2xl bg-slate-950/45 px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
