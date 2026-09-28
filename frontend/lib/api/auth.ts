import api from "./client";

export async function login(
  username: string,
  password: string
) {
  const response = await api.post("/token/", {
    username,
    password,
  });

  return response.data;
}

export async function register(
  username: string,
  email: string,
  password: string
) {
  const response = await api.post("/accounts/register/", {
    username,
    email,
    password,
  });

  return response.data;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  }
}
