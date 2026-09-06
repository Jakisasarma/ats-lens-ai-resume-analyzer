import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   COMMON TYPES
========================================================= */

export interface CandidateInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  currentTitle?: string;
}

export interface AtsInfo {
  score?: number;
  rating?: string;
  summary?: string;
}

export interface ScoreItem {
  score?: number;
  max?: number;
  percentage?: number;
  explanation?: string;
  evidence?: string[];
}

/* =========================================================
   HISTORY ITEM
========================================================= */

export interface HistoryItem {
  _id: string;
  id?: string;

  fileName: string;
  fileType?: string;
  status?: string;

  candidate?: CandidateInfo;
  ats?: AtsInfo;

  createdAt: string;
}

/* =========================================================
   FULL RESUME ANALYSIS
========================================================= */

export interface ResumeAnalysis {
  _id: string;
  id?: string;

  fileName: string;
  fileType?: string;

  extractedText?: string;
  jobDescription?: string;

  document?: {
    pageCount?: number | null;
    wordCount?: number;
    parsingConfidence?: number;
  };

  candidate?: CandidateInfo;

  ats?: AtsInfo;

  scores?: {
    keywordMatch?: ScoreItem;
    keywordSkill?: ScoreItem;
    jobRelevance?: ScoreItem;
    structure?: ScoreItem;
    atsStructure?: ScoreItem;
    experience?: ScoreItem;
    educationCertification?: ScoreItem;
    achievements?: ScoreItem;
    formatting?: ScoreItem;

    [key: string]:
      | ScoreItem
      | undefined;
  };

  skills?: {
    detected?: string[];
    matched?: string[];
    missing?: string[];
    partial?: string[];
  };

  sections?: {
    summary?: boolean;
    experience?: boolean;
    education?: boolean;
    skills?: boolean;
    projects?: boolean;
    certifications?: boolean;
    achievements?: boolean;
  };

  atsRisks?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];

  finalVerdict?: string;

  status?: string;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   API RESPONSE TYPES
========================================================= */

export interface AnalyzeResumeResponse {
  success: boolean;

  message?: string;

  analysis: ResumeAnalysis;
}

export interface ResumeHistoryResponse {
  success: boolean;

  message?: string;

  count?: number;

  analyses: HistoryItem[];
}

export interface ResumeAnalysisResponse {
  success: boolean;

  message?: string;

  analysis: ResumeAnalysis;
}

export interface DeleteResumeResponse {
  success: boolean;

  message?: string;
}

/* =========================================================
   GET SAVED JWT TOKEN
========================================================= */

const getToken = (): string | null => {
  return (
    localStorage.getItem(
      "atsLensToken"
    ) ||
    sessionStorage.getItem(
      "atsLensToken"
    )
  );
};

/* =========================================================
   AUTH HEADER
========================================================= */

const getAuthHeaders = () => {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Authentication token not found. Please sign in again."
    );
  }

  return {
    Authorization:
      `Bearer ${token}`,
  };
};

/* =========================================================
   ANALYZE RESUME
========================================================= */

export const uploadResume = async (
  file: File,
  jobDescription = ""
): Promise<AnalyzeResumeResponse> => {
  const formData =
    new FormData();

  formData.append(
    "resume",
    file
  );

  if (
    jobDescription.trim()
  ) {
    formData.append(
      "jobDescription",
      jobDescription.trim()
    );
  }

  const response =
    await axios.post<AnalyzeResumeResponse>(
      `${API_URL}/resume/analyze`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

  return response.data;
};

/* =========================================================
   GET LOGGED-IN USER HISTORY
========================================================= */

export const getResumeHistory =
  async (): Promise<ResumeHistoryResponse> => {
    const response =
      await axios.get<ResumeHistoryResponse>(
        `${API_URL}/resume/history`,
        {
          headers:
            getAuthHeaders(),
        }
      );

    return response.data;
  };

/* =========================================================
   GET ONE RESUME ANALYSIS
========================================================= */

export const getResumeAnalysis =
  async (
    id: string
  ): Promise<ResumeAnalysisResponse> => {
    const response =
      await axios.get<ResumeAnalysisResponse>(
        `${API_URL}/resume/${id}`,
        {
          headers:
            getAuthHeaders(),
        }
      );

    return response.data;
  };

/* =========================================================
   DELETE RESUME ANALYSIS
========================================================= */

export const deleteResumeAnalysis =
  async (
    id: string
  ): Promise<DeleteResumeResponse> => {
    const response =
      await axios.delete<DeleteResumeResponse>(
        `${API_URL}/resume/${id}`,
        {
          headers:
            getAuthHeaders(),
        }
      );

    return response.data;
  };