import axios from "axios";
import { cryptoEnabled, encryptPayload, decryptPayload } from "./crypto";

const baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:7777/vehicleowneralerts/platform/admin";

const TOKEN_KEY = "amv_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 25000,
  headers: { "Content-Type": "application/json" },
});

/* Attach the bearer token + transparent payload encryption on every request. */
api.interceptors.request.use(async (config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (
    cryptoEnabled() &&
    config.data &&
    typeof config.data === "object" &&
    !(config.data instanceof FormData)
  ) {
    const enc = await encryptPayload(config.data);
    config.data = { data: enc };
  }
  return config;
});

/* Decrypt the response envelope; auto-logout on 401. */
api.interceptors.response.use(
  async (response) => {
    const body = response?.data;
    const looksEncrypted =
      body &&
      typeof body === "object" &&
      typeof body.data === "string" &&
      Object.keys(body).length === 1;
    if (looksEncrypted) {
      if (!cryptoEnabled()) {
        throw new Error(
          "Encryption key missing on the client (REACT_APP_SECRET_KEY)."
        );
      }
      response.data = await decryptPayload(body.data);
    }
    return response;
  },
  async (error) => {
    const body = error?.response?.data;
    if (
      cryptoEnabled() &&
      body &&
      typeof body === "object" &&
      typeof body.data === "string" &&
      Object.keys(body).length === 1
    ) {
      try {
        error.response.data = await decryptPayload(body.data);
      } catch (_) {
        /* leave as-is */
      }
    }
    if (error?.response?.status === 401) {
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Normalize the ServerPe envelope into a resolved body or a thrown Error
 * carrying `.message`, `.statuscode`, `.data`.
 */
export async function request(promise) {
  try {
    const res = await promise;
    const body = res?.data ?? {};
    if (body.successstatus === false) {
      const err = new Error(body.message || "Request failed");
      err.statuscode = body.statuscode;
      err.data = body.data;
      throw err;
    }
    return body;
  } catch (e) {
    if (e.response?.data) {
      const body = e.response.data;
      const err = new Error(body.message || "Request failed");
      err.statuscode = body.statuscode ?? e.response.status;
      err.data = body.data;
      throw err;
    }
    if (e.code === "ECONNABORTED")
      throw new Error("The server took too long to respond. Please try again.");
    if (e.message === "Network Error")
      throw new Error("Cannot reach the server. Please check your connection.");
    throw e;
  }
}
