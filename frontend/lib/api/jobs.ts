import api from "./client";

export type Job = {
  id: number;
  company: string;
  title: string;
  description: string;
  location: string;
  source_url: string;
  created_at: string;
};

export type CreateJobData = {
  company: string;
  title: string;
  description: string;
  location?: string;
  source_url?: string;
};

export async function createJob(
  data: CreateJobData
): Promise<Job> {
  const response = await api.post<Job>(
    "/jobs/",
    data
  );

  return response.data;
}

export async function getJobs(): Promise<Job[]> {
  const response = await api.get<Job[]>(
    "/jobs/"
  );

  return response.data;
}

export async function getJob(
  jobId: number
): Promise<Job> {
  const response = await api.get<Job>(
    `/jobs/${jobId}/`
  );

  return response.data;
}

export async function deleteJob(
  jobId: number
): Promise<void> {
  await api.delete(`/jobs/${jobId}/`);
}


export type JobImportConfidence =
  | "high"
  | "medium"
  | "low";

export type JobImportPreview = {
  source_url: string;
  title: string;
  company: string;
  location: string;
  description: string;
  is_job_offer: boolean;
  confidence: JobImportConfidence;
};

export async function importJobPreview(
  url: string
): Promise<JobImportPreview> {
  const response = await api.post<JobImportPreview>(
    "/jobs/import-preview/",
    {
      url,
    }
  );

  return response.data;
}


export type ExternalJob = {
  external_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  source_url: string;
  created: string;
};

export type JobSearchResponse = {
  count: number;
  page: number;
  results: ExternalJob[];
};

export async function searchJobs(
  query: string,
  location = "",
  page = 1
): Promise<JobSearchResponse> {
  const response = await api.get<JobSearchResponse>(
    "/jobs/search/",
    {
      params: {
        query,
        location,
        page,
      },
    }
  );

  return response.data;
}
