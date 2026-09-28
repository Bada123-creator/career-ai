import api from "./client";

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  phone: string;
  city: string;
  target_role: string;
  bio: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  created_at: string;
  updated_at: string;
};

export async function getProfile(): Promise<UserProfile> {
  const response = await api.get("/accounts/me/");
  return response.data;
}

export type UpdateUserProfilePayload = {
  phone?: string;
  city?: string;
  target_role?: string;
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
};

export async function updateProfile(
  data: UpdateUserProfilePayload
): Promise<UserProfile> {
  const response = await api.put<UserProfile>(
    "/accounts/me/",
    data
  );

  return response.data;
}
