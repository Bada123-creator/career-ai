import api from "./client";

export type ApplicationStatus =
  | "draft"
  | "sent"
  | "interview"
  | "accepted"
  | "rejected";

export type Application = {
  id: number;
  job: number;
  job_title: string;
  company: string;
  location: string;
  analysis: number | null;
  analysis_score: number | null;
  generated_resume: number | null;
  generated_resume_version: number | null;
  generated_resume_title: string | null;
  has_generated_resume: boolean;
  has_cover_letter: boolean;
  has_interview_preparation: boolean;
  status: ApplicationStatus;
  status_display: string;
  notes: string;
  applied_at: string | null;
  follow_up_at: string | null;
  next_action: string;
  created_at: string;
  updated_at: string;
};

export type CreateApplicationData = {
  job: number;
  analysis?: number | null;
  generated_resume?: number | null;
  status?: ApplicationStatus;
  notes?: string;
  applied_at?: string | null;
  follow_up_at?: string | null;
  next_action?: string;
};

export type UpdateApplicationData = {
  analysis?: number | null;
  generated_resume?: number | null;
  status?: ApplicationStatus;
  notes?: string;
  applied_at?: string | null;
  follow_up_at?: string | null;
  next_action?: string;
};

export async function getApplications(): Promise<Application[]> {
  const response = await api.get("/applications/");
  return response.data;
}

export async function getApplication(
  applicationId: number
): Promise<Application> {
  const response = await api.get(
    `/applications/${applicationId}/`
  );
  return response.data;
}

export async function createApplication(
  data: CreateApplicationData
): Promise<Application> {
  const response = await api.post(
    "/applications/",
    data
  );

  return response.data;
}

export async function updateApplication(
  applicationId: number,
  data: UpdateApplicationData
): Promise<Application> {
  const response = await api.patch(
    `/applications/${applicationId}/`,
    data
  );

  return response.data;
}

export async function deleteApplication(
  applicationId: number
): Promise<void> {
  await api.delete(
    `/applications/${applicationId}/`
  );
}


export type AIFollowUp = {
  subject: string;
  message: string;
  tone: "professional";
};

export async function generateApplicationFollowUp(
  applicationId: number
): Promise<AIFollowUp> {
  const response = await api.post<AIFollowUp>(
    `/ai/applications/${applicationId}/follow-up/`
  );

  return response.data;
}
