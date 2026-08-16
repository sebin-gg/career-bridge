import { buildResumeProfile } from "./resume";
import { extractKeywords, normalizeText, sentenceSplit, unique } from "./keywords";
import type { AnalysisResult } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function deriveReadiness(score: number) {
  if (score >= 75) {
    return "Strong fit" as const;
  }

  if (score >= 55) {
    return "Promising fit" as const;
  }

  return "Needs work" as const;
}

export function analyzeResumeAgainstJob(resumeText: string, jobDescription: string) {
  const resumeProfile = buildResumeProfile(resumeText);
  const jobKeywords = extractKeywords(jobDescription);
  const normalizedResume = normalizeText(resumeText);
  const normalizedJob = normalizeText(jobDescription);

  const matchedKeywords = jobKeywords.filter((keyword) =>
    normalizedResume.includes(keyword),
  );
  const missingKeywords = jobKeywords.filter(
    (keyword) => !normalizedResume.includes(keyword),
  );

  const jobSentences = sentenceSplit(jobDescription);
  const roleFocusHits = jobSentences.filter((sentence) =>
    /(own|lead|partner|design|ship|analyze|support|manage|build)/i.test(
      sentence,
    ),
  ).length;

  const scoreFromKeywords =
    jobKeywords.length === 0
      ? 50
      : Math.round((matchedKeywords.length / jobKeywords.length) * 65);
  const scoreFromExperience = clamp(resumeProfile.yearsOfExperience * 4, 0, 20);
  const scoreFromSignals = clamp(roleFocusHits * 3, 0, 15);
  const score = clamp(
    scoreFromKeywords + scoreFromExperience + scoreFromSignals,
    18,
    96,
  );

  const readiness = deriveReadiness(score);
  const fitReasons = unique([
    matchedKeywords.length
      ? `Your resume already reflects ${matchedKeywords.slice(0, 4).join(", ")}.`
      : "Your resume has some relevant signals, but not enough direct keyword overlap yet.",
    resumeProfile.yearsOfExperience
      ? `Estimated experience signal: about ${resumeProfile.yearsOfExperience} years.`
      : "Experience duration is not clearly stated, so recruiters may infer less seniority.",
    resumeProfile.strengths[0]
      ? `Best evidence line: ${resumeProfile.strengths[0]}`
      : "The resume would benefit from stronger achievement statements with measurable outcomes.",
  ]).slice(0, 3);

  const rewriteSuggestions = missingKeywords.slice(0, 4).map((keyword) => {
    if (normalizedJob.includes("experience with")) {
      return `Add a concrete bullet showing experience with ${keyword}, including a metric or scope.`;
    }

    return `If accurate, mention ${keyword} in your summary or a project bullet with business impact.`;
  });

  if (rewriteSuggestions.length === 0) {
    rewriteSuggestions.push(
      "Tighten the summary so the first three lines match the target role more directly.",
    );
  }

  const interviewTalkingPoints = unique([
    ...matchedKeywords.slice(0, 3).map(
      (keyword) => `Prepare a story that proves your strength in ${keyword}.`,
    ),
    ...resumeProfile.strengths.slice(0, 2).map(
      (strength) => `Turn this into a STAR answer: ${strength}`,
    ),
  ]).slice(0, 4);

  const buckets = [
    {
      label: "Keyword overlap",
      score: clamp(scoreFromKeywords, 0, 100),
    },
    {
      label: "Experience signal",
      score: clamp(scoreFromExperience * 5, 0, 100),
    },
    {
      label: "Role alignment",
      score: clamp(scoreFromSignals * 6, 0, 100),
    },
  ];

  const summary =
    readiness === "Strong fit"
      ? "The resume already lines up with the role. Main opportunity: sharper proof and tighter wording."
      : readiness === "Promising fit"
        ? "There is real overlap, but the resume is underselling a few role-critical terms and outcomes."
        : "The role and resume are not aligned enough yet. The fastest gain is adding direct evidence for the missing keywords.";

  return {
    score,
    readiness,
    summary,
    fitReasons,
    missingKeywords: missingKeywords.slice(0, 8),
    rewriteSuggestions,
    interviewTalkingPoints,
    buckets,
    resumeProfile,
    jobKeywords,
  } satisfies AnalysisResult;
}
