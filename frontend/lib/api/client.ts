import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_URL = "http://127.0.0.1:8001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;

function clearAuthAndRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("access");
  localStorage.removeItem("refresh");

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function refreshAccessToken(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error(
      "Le renouvellement du token nécessite le navigateur."
    );
  }

  const refresh = localStorage.getItem("refresh");

  if (!refresh) {
    throw new Error(
      "Aucun refresh token disponible."
    );
  }

  const response = await axios.post(
    `${API_URL}/token/refresh/`,
    {
      refresh,
    }
  );

  const newAccess = response.data.access;

  if (!newAccess) {
    throw new Error(
      "Aucun access token retourné."
    );
  }

  localStorage.setItem(
    "access",
    newAccess
  );

  return newAccess;
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const access =
        localStorage.getItem("access");

      if (access) {
        config.headers.Authorization =
          `Bearer ${access}`;
      }
    }

    return config;
  }
);

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as
        | (InternalAxiosRequestConfig & {
            _retry?: boolean;
          })
        | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      typeof window === "undefined"
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise =
          refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
      }

      const newAccess =
        await refreshPromise;

      originalRequest.headers.Authorization =
        `Bearer ${newAccess}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearAuthAndRedirect();

      return Promise.reject(
        refreshError
      );
    }
  }
);

export default api;
