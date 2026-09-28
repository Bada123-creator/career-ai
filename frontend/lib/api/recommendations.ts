import api from "./client";

export type JobRecommendationLevel =
  | "strong"
  | "good"
  | "partial"
  | "weak";

export type RecommendedJob = {
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    source_url: string;
  };
  score: number;
  match_level: JobRecommendationLevel;
  summary: string;
  matching_skills: string[];
  missing_skills: string[];
  reasons: string[];
  recommendation: string;
};

export type JobRecommendationsResponse = {
  resume: {
    id: number;
    title: string;
  };
  count: number;
  cached_count: number;
  generated_count: number;
  recommendations: RecommendedJob[];
};

export async function getJobRecommendations(
  resumeId: number,
  refresh = false
): Promise<JobRecommendationsResponse> {
  const response =
    await api.get<JobRecommendationsResponse>(
      "/ai/job-recommendations/",
      {
        params: {
          resume_id: resumeId,
          refresh,
        },
      }
    );

  return response.data;
}
