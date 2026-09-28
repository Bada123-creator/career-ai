import api from "./client";

export type DashboardStats = {
  resumes: number;
  jobs: number;
  analyses: number;
  applications: number;
  active_applications: number;
  interviews: number;
  average_match_score: number | null;
};

export type DashboardRecentAnalysis = {
  id: number;
  resume: {
    id: number;
    title: string;
  };
  job: {
    id: number;
    title: string;
    company: string;
  };
  overall_score: number;
  created_at: string;
};

export type DashboardRecentApplication = {
  id: number;
  job: {
    id: number;
    title: string;
    company: string;
  };
  status:
    | "draft"
    | "sent"
    | "interview"
    | "accepted"
    | "rejected";
  applied_at: string | null;
  created_at: string;
};

export type DashboardInterviewProgress = {
  preparation_id: number;
  analysis_id: number;
  job: {
    title: string;
    company: string;
  };
  answered_questions: number;
  total_questions: number;
  completion_percentage: number;
  completed: boolean;
  has_final_report: boolean;
  updated_at: string;
};

export type DashboardAction = {
  type: string;
  title: string;
  description: string;
  href: string;
};

export type DashboardApplicationPipeline = {
  draft: number;
  sent: number;
  interview: number;
  accepted: number;
  rejected: number;
};

export type DashboardData = {
  application_pipeline: DashboardApplicationPipeline;
  stats: DashboardStats;
  recent_analyses: DashboardRecentAnalysis[];
  recent_applications: DashboardRecentApplication[];
  interview_progress: DashboardInterviewProgress[];
  actions: DashboardAction[];
};

export async function getDashboard(): Promise<DashboardData> {
  const response = await api.get("/ai/dashboard/");
  return response.data;
}
