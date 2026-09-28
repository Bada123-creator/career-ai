import api from "./client";

export type Resume = {
  id: number;
  title: string;
  file: string | null;
  extracted_text: string;
  skills: string;
  education: string;
  experience: string;
  created_at: string;
  updated_at: string;
};

export async function uploadResume(
  title: string,
  file: File
): Promise<Resume> {
  const formData = new FormData();

  formData.append("title", title);
  formData.append("file", file);

  const response = await api.post<Resume>(
    "/cvs/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function getResumes(): Promise<Resume[]> {
  const response = await api.get<Resume[]>("/cvs/");
  return response.data;
}

export async function getResume(
  resumeId: number
): Promise<Resume> {
  const response = await api.get<Resume>(
    `/cvs/${resumeId}/`
  );

  return response.data;
}

export async function deleteResume(
  resumeId: number
): Promise<void> {
  await api.delete(`/cvs/${resumeId}/`);
}
