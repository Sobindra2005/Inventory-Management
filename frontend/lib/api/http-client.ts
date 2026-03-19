import axios from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type AuthTokenGetter = () => Promise<string | null>;

let authTokenGetter: AuthTokenGetter | null = null;

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setHttpClientAuthTokenGetter = (getter: AuthTokenGetter | null) => {
  authTokenGetter = getter;
};

httpClient.interceptors.request.use(async (config) => {
  if (!authTokenGetter) {
    return config;
  }

  const token = await authTokenGetter();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
