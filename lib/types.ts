export type Paper = {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string;
  abstract: string;
  doi: string | null;
  landingPageUrl: string | null;
  pdfUrl: string | null;
  citedByCount: number;
  topic: string;
  arxivId?: string | null;
  openReviewId?: string | null;
};

export type PaperLog = {
  id: number | string;
  paperId: string;
  displayName: string;
  rating: number | null;
  status: "first-impression" | "skimmed" | "read" | "studied" | "ran-code";
  comment: string;
  createdAt: string;
  updatedAt?: string;
  profileSlug?: string | null;
  isOwner?: boolean;
  helpfulCount?: number;
  replyCount?: number;
  viewerHelpful?: boolean;
  replies?: PaperReply[];
};

export type PaperReply = {
  id: number;
  logId: number;
  paperId: string;
  displayName: string;
  comment: string;
  authorResponse: boolean;
  createdAt: string;
  profileSlug?: string | null;
  isOwner?: boolean;
};

export type CodeExperience = {
  id: number;
  paperId: string;
  displayName: string;
  repositoryUrl: string;
  commitRef: string;
  environment: string;
  dataset: string;
  outcome: "reproduced" | "partially-reproduced" | "did-not-reproduce" | "could-not-run";
  reproducibilityRating: number | null;
  notes: string;
  artifactUrl: string | null;
  createdAt: string;
  updatedAt: string;
  profileSlug?: string | null;
  isOwner?: boolean;
};

export type PaperSummary = { paperId: string; averageRating: number; ratingCount: number; logCount: number; codeExperienceCount: number };

export type ProfilePaperEntry = {
  paper: Pick<Paper, "id" | "title" | "authors" | "year" | "venue" | "topic">;
  log?: PaperLog;
  savedAt?: string;
};
