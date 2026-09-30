import api from "@/lib/api/client";

export type LearningSkillStatus =
  | "todo"
  | "learning"
  | "completed";

export type LearningSkillPriority =
  | "high"
  | "medium"
  | "low";

export type LearningSkill = {
  id: number;
  resume_id: number;
  skill: string;
  priority: LearningSkillPriority;
  status: LearningSkillStatus;
  progress: number;
  objective: string;
  notes: string;
  job_count: number;
  frequency: number;
  created_at: string;
  updated_at: string;
};

export type LearningPlanResponse = {
  resume: {
    id: number;
    title: string;
  };
  count: number;
  skills: LearningSkill[];
};

export type LearningPlanSyncResponse =
  LearningPlanResponse & {
    created_count: number;
    updated_count: number;
  };

export type UpdateLearningSkillPayload = {
  status?: LearningSkillStatus;
  progress?: number;
  objective?: string;
  notes?: string;
};

export async function getLearningPlan(
  resumeId: number
): Promise<LearningPlanResponse> {
  const response = await api.get(
    "/ai/learning-plan/",
    {
      params: {
        resume_id: resumeId,
      },
    }
  );

  return response.data;
}

export async function syncLearningPlan(
  resumeId: number
): Promise<LearningPlanSyncResponse> {
  const response = await api.post(
    "/ai/learning-plan/sync/",
    {
      resume_id: resumeId,
    }
  );

  return response.data;
}

export async function updateLearningSkill(
  skillId: number,
  payload: UpdateLearningSkillPayload
): Promise<LearningSkill> {
  const response = await api.patch(
    `/ai/learning-skills/${skillId}/`,
    payload
  );

  return response.data;
}
