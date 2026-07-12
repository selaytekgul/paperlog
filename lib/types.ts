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
};

export type PaperLog = {
  id: number | string;
  paperId: string;
  displayName: string;
  rating: number | null;
  status: "first-impression" | "skimmed" | "read" | "studied" | "ran-code";
  comment: string;
  createdAt: string;
};
