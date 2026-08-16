import { extractKeywords, sentenceSplit, unique } from "./keywords";
import type { ResumeProfile, ResumeSection } from "./types";

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractPhone(text: string) {
  return (
    text.match(
      /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/,
    )?.[0] ?? null
  );
}

function extractName(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLikelyName = lines.find((line) => {
    if (line.length < 4 || line.length > 40) {
      return false;
    }

    if (/\d|@|http|linkedin|github/i.test(line)) {
      return false;
    }

    return /^[A-Za-z][A-Za-z ,.'-]+$/.test(line);
  });

  if (firstLikelyName) {
    return firstLikelyName;
  }

  const leadingName = text
    .trim()
    .match(
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?:\s+B\.?Tech|\s+Student|\s+\+\d|\s+[A-Z0-9._%+-]+@)/,
    )?.[1];

  return leadingName ?? "Candidate";
}

function extractExperienceYears(text: string) {
  const directMatch = text.match(/(\d+)\+?\s+years? of experience/i);
  if (directMatch) {
    return Number(directMatch[1]);
  }

  const allYears = [...text.matchAll(/\b(20\d{2})\b/g)].map((match) =>
    Number(match[1]),
  );

  if (allYears.length < 2) {
    return 0;
  }

  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const span = Math.max(0, maxYear - minYear);
  return Math.min(span, 25);
}

function parseSections(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sectionHeadings = new Set([
    "summary",
    "experience",
    "work experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "awards",
    "leadership",
  ]);

  const sections: ResumeSection[] = [];
  let current: ResumeSection = { title: "Overview", content: "" };

  for (const line of lines) {
    const normalized = line.toLowerCase();
    const isHeading =
      sectionHeadings.has(normalized) ||
      (/^[A-Z][A-Z &/]{3,}$/.test(line) && line.length <= 30);

    if (isHeading) {
      if (current.content.trim()) {
        sections.push(current);
      }

      current = { title: line, content: "" };
      continue;
    }

    current.content += `${line}\n`;
  }

  if (current.content.trim()) {
    sections.push(current);
  }

  return sections;
}

export function buildResumeProfile(resumeText: string): ResumeProfile {
  const sections = parseSections(resumeText);
  const skills = extractKeywords(resumeText);
  const strengths = unique(
    sentenceSplit(resumeText)
      .filter((sentence) =>
        /(built|led|improved|launched|increased|reduced|delivered|owned)/i.test(
          sentence,
        ),
      )
      .slice(0, 4),
  );

  return {
    candidateName: extractName(resumeText),
    email: extractEmail(resumeText),
    phone: extractPhone(resumeText),
    yearsOfExperience: extractExperienceYears(resumeText),
    skills,
    strengths,
    sections,
    resumeText,
  };
}
