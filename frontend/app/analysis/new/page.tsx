import NewAnalysisClient from "./NewAnalysisClient";

type NewAnalysisPageProps = {
  searchParams: Promise<{
    resume?: string | string[];
    job?: string | string[];
  }>;
};

export default async function NewAnalysisPage({
  searchParams,
}: NewAnalysisPageProps) {
  const params = await searchParams;

  const rawResume = params.resume;
  const rawJob = params.job;

  const resumeParam =
    typeof rawResume === "string"
      ? rawResume
      : null;

  const jobParam =
    typeof rawJob === "string"
      ? rawJob
      : null;

  return (
    <NewAnalysisClient
      resumeParam={resumeParam}
      jobParam={jobParam}
    />
  );
}
