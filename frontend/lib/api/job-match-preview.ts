import api from "./client";
import type { ExternalJob } from "./jobs";

export type JobMatchPreview = {
  external_id: string;
  score: number | null;
  matching_skills: string[];
  missing_skills: string[];
  essential_skills: string[];
  complementary_skills: string[];
  evaluated_skills_count: number;
  basis: "skills_only";
};

export type JobMatchPreviewResponse = {
  resume: {
    id: number;
    title: string;
  };
  count: number;
  basis: "skills_only";
  previews: JobMatchPreview[];
};

export async function previewJobMatches(
  resumeId: number,
  jobs: ExternalJob[]
): Promise<JobMatchPreviewResponse> {
  const response =
    await api.post<JobMatchPreviewResponse>(
      "/ai/job-match-preview/",
      {
        resume_id: resumeId,
        jobs: jobs.map((job) => ({
          external_id: job.external_id,
          title: job.title,
          description: job.description,
        })),
      }
    );

  return response.data;
}
