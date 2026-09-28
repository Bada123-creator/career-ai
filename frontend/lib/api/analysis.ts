import api from "./client";

export type Analysis = {
  id: number;
  resume: {
    id: number;
    title: string;
  };
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
  };
  matching: {
    overall_score: number;
    skill_score: number | null;
    experience_score: number | null;
    education_score: number | null;
    matching_skills: string[];
    missing_skills: string[];
  };
  ai_available: boolean;
  ai_analysis: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    relevant_experience: string[];
    relevant_education: string[];
  } | null;
  created_at: string;
};

export async function analyzeApplication(
  resumeId: number,
  jobId: number
) {
  const response = await api.post(
    "/ai/match/",
    {
      resume_id: resumeId,
      job_id: jobId,
    }
  );

  return response.data;
}

export async function getAnalyses(): Promise<Analysis[]> {
  const response = await api.get("/ai/analyses/");
  return response.data;
}

export async function getAnalysis(
  analysisId: number
): Promise<Analysis> {
  const response = await api.get(
    `/ai/analyses/${analysisId}/`
  );

  return response.data;
}


export type CoverLetter = {
  id: number;
  analysis_id: number;
  content: string;
  created_at: string;
  updated_at: string;
};


export async function generateCoverLetter(
  analysisId: number
): Promise<CoverLetter> {
  const response = await api.post(
    `/ai/analyses/${analysisId}/cover-letter/`
  );

  return response.data;
}


export async function getCoverLetters(
  analysisId: number
): Promise<CoverLetter[]> {
  const response = await api.get(
    `/ai/analyses/${analysisId}/cover-letters/`
  );

  return response.data;
}


export async function getCoverLetter(
  coverLetterId: number
): Promise<CoverLetter> {
  const response = await api.get(
    `/ai/cover-letters/${coverLetterId}/`
  );

  return response.data;
}


export async function updateCoverLetter(
  coverLetterId: number,
  content: string
): Promise<CoverLetter> {
  const response = await api.patch(
    `/ai/cover-letters/${coverLetterId}/`,
    {
      content,
    }
  );

  return response.data;
}


export async function deleteCoverLetter(
  coverLetterId: number
): Promise<void> {
  await api.delete(
    `/ai/cover-letters/${coverLetterId}/`
  );
}


export type InterviewQuestionType =
  | "hr"
  | "technical"
  | "cv"
  | "situational";


export type InterviewQuestion = {
  type: InterviewQuestionType;
  question: string;
  suggested_answer: string;
  tips: string[];
};


export type InterviewPreparation = {
  id: number;
  analysis_id: number;
  questions: InterviewQuestion[];
  general_advice: string[];
  created_at: string;
  updated_at: string;
};


export async function generateInterviewPreparation(
  analysisId: number
): Promise<InterviewPreparation> {
  const response = await api.post(
    `/ai/analyses/${analysisId}/interview-preparation/`
  );

  return response.data;
}


export async function getInterviewPreparations(
  analysisId: number
): Promise<InterviewPreparation[]> {
  const response = await api.get(
    `/ai/analyses/${analysisId}/interview-preparations/`
  );

  return response.data;
}


export async function getInterviewPreparation(
  preparationId: number
): Promise<InterviewPreparation> {
  const response = await api.get(
    `/ai/interview-preparations/${preparationId}/`
  );

  return response.data;
}


export async function updateInterviewPreparation(
  preparationId: number,
  data: {
    questions?: InterviewQuestion[];
    general_advice?: string[];
  }
): Promise<InterviewPreparation> {
  const response = await api.patch(
    `/ai/interview-preparations/${preparationId}/`,
    data
  );

  return response.data;
}


export async function deleteInterviewPreparation(
  preparationId: number
): Promise<void> {
  await api.delete(
    `/ai/interview-preparations/${preparationId}/`
  );
}


export type InterviewAnswerFeedback = {
  score: number;
  strengths: string[];
  improvements: string[];
  improved_answer: string;
  delivery_tips: string[];
};


export type InterviewAnswer = {
  id: number;
  preparation_id: number;
  question_index: number;
  question_type: InterviewQuestionType;
  question: string;
  answer: string;
  feedback: InterviewAnswerFeedback;
  created_at: string;
  updated_at: string;
};


export async function getInterviewAnswers(
  preparationId: number
): Promise<InterviewAnswer[]> {
  const response = await api.get(
    `/ai/interview-preparations/${preparationId}/answers/`
  );

  return response.data;
}


export async function evaluateInterviewAnswer(
  preparationId: number,
  questionIndex: number,
  answer: string
): Promise<InterviewAnswer> {
  const response = await api.post(
    `/ai/interview-preparations/${preparationId}/answers/`,
    {
      question_index: questionIndex,
      answer,
    }
  );

  return response.data;
}


export type InterviewReportQuestion = {
  question_index: number;
  question: string;
  question_type: InterviewQuestionType;
  score: number;
};


export type InterviewReport = {
  preparation_id: number;
  analysis_id: number;
  job: {
    title: string;
    company: string;
  };
  total_questions: number;
  answered_questions: number;
  completion_percentage: number;
  average_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
  best_answer: InterviewReportQuestion | null;
  weakest_answer: InterviewReportQuestion | null;
  completed: boolean;
};


export async function getInterviewReport(
  preparationId: number
): Promise<InterviewReport> {
  const response = await api.get(
    `/ai/interview-preparations/${preparationId}/report/`
  );

  return response.data;
}


export type InterviewFinalReportContent = {
  summary: string;
  recurring_strengths: string[];
  priority_improvements: string[];
  skills_to_highlight: string[];
  final_recommendations: string[];
};

export type InterviewFinalReport = {
  id: number;
  preparation_id: number;
  average_score: number;
  report: InterviewFinalReportContent;
  created_at: string;
  updated_at: string;
};

export async function getInterviewFinalReport(
  preparationId: number
): Promise<InterviewFinalReport> {
  const response = await api.get(
    `/ai/interview-preparations/${preparationId}/final-report/`
  );

  return response.data;
}

export async function generateInterviewFinalReport(
  preparationId: number
): Promise<InterviewFinalReport> {
  const response = await api.post(
    `/ai/interview-preparations/${preparationId}/final-report/`,
    {}
  );

  return response.data;
}


export type CVOptimizationKeywordStatus =
  | "present"
  | "supported_but_not_explicit"
  | "missing";

export type CVOptimizationKeyword = {
  keyword: string;
  status: CVOptimizationKeywordStatus;
  recommendation: string;
};

export type CVOptimizationRewrite = {
  original: string;
  optimized: string;
  reason: string;
};

export type CVOptimizationContent = {
  professional_summary: string;
  skills_to_highlight: string[];
  experience_rewrites: CVOptimizationRewrite[];
  relevant_keywords: CVOptimizationKeyword[];
  priority_recommendations: string[];
  warnings: string[];
};

export type CVOptimization = {
  id: number;
  analysis_id: number;
  optimization: CVOptimizationContent;
  created_at: string;
  updated_at: string;
};

export async function getCVOptimization(
  analysisId: number
): Promise<CVOptimization> {
  const response = await api.get(
    `/ai/analyses/${analysisId}/cv-optimization/`
  );

  return response.data;
}

export async function generateCVOptimization(
  analysisId: number
): Promise<CVOptimization> {
  const response = await api.post(
    `/ai/analyses/${analysisId}/cv-optimization/`,
    {}
  );

  return response.data;
}


export type GeneratedResumeHeader = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

export type GeneratedResumeExperience = {
  title: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
};

export type GeneratedResumeEducation = {
  degree: string;
  institution: string;
  location: string;
  dates: string;
  details: string[];
};

export type GeneratedResumeProject = {
  name: string;
  technologies: string[];
  description: string[];
};

export type GeneratedResumeAdditionalSection = {
  title: string;
  items: string[];
};

export type GeneratedResumeContent = {
  header: GeneratedResumeHeader;
  professional_summary: string;
  skills: string[];
  experiences: GeneratedResumeExperience[];
  education: GeneratedResumeEducation[];
  projects: GeneratedResumeProject[];
  languages: string[];
  additional_sections: GeneratedResumeAdditionalSection[];
};

export type GeneratedResume = {
  id: number;
  analysis_id: number;
  source_resume_id: number;
  title: string;
  version: number;
  content: GeneratedResumeContent;
  created_at: string;
  updated_at: string;
};

export async function getGeneratedResume(
  analysisId: number
): Promise<GeneratedResume> {
  const response = await api.get(
    `/ai/analyses/${analysisId}/generated-resume/`
  );

  return response.data;
}

export async function getGeneratedResumeHistory(
  analysisId: number
): Promise<GeneratedResume[]> {
  const response = await api.get(
    `/ai/analyses/${analysisId}/generated-resumes/`
  );

  return response.data;
}

export async function generateResume(
  analysisId: number
): Promise<GeneratedResume> {
  const response = await api.post(
    `/ai/analyses/${analysisId}/generated-resume/`,
    {}
  );

  return response.data;
}
