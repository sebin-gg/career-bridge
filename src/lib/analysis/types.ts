export type ResumeSection = {
  title: string;
  content: string;
};

export type ResumeProfile = {
  candidateName: string;
  email: string | null;
  phone: string | null;
  yearsOfExperience: number;
  skills: string[];
  strengths: string[];
  sections: ResumeSection[];
  resumeText: string;
};

export type MatchBucket = {
  label: string;
  score: number;
};

export type AnalysisResult = {
  score: number;
  readiness: "Strong fit" | "Promising fit" | "Needs work";
  summary: string;
  fitReasons: string[];
  missingKeywords: string[];
  rewriteSuggestions: string[];
  interviewTalkingPoints: string[];
  buckets: MatchBucket[];
  resumeProfile: ResumeProfile;
  jobKeywords: string[];
  aiModel?: string;
  aiRecommendations?: string[];
};
