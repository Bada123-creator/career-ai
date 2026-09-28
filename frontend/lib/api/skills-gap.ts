import api from "./client";

export type SkillGapPriority =
  | "mastered"
  | "high"
  | "medium"
  | "low";

export type SkillGapItem = {
  skill: string;
  job_count: number;
  job_ids: number[];
  companies: string[];
  mastered: boolean;
  frequency: number;
  priority: SkillGapPriority;
};

export type SkillsGapResponse = {
  resume: {
    id: number;
    title: string;
  };
  total_jobs: number;
  total_skills: number;
  mastered_count: number;
  missing_count: number;
  coverage: number;
  skills: SkillGapItem[];
  priority_skills: SkillGapItem[];
};

export async function getSkillsGap(
  resumeId: number
): Promise<SkillsGapResponse> {
  const response =
    await api.get<SkillsGapResponse>(
      "/ai/skills-gap/",
      {
        params: {
          resume_id: resumeId,
        },
      }
    );

  return response.data;
}
