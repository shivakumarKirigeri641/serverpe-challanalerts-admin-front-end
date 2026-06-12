import { api, request } from "./client";

/* --------------------------------- auth ---------------------------------- */
export const sendLoginOtp = (mobile_number) =>
  request(api.post("/auth/login/send-otp", { mobile_number }));

export const verifyLoginOtp = (mobile_number, otp) =>
  request(api.post("/auth/login/verify-otp", { mobile_number, otp }));

export const logout = () => request(api.post("/auth/logout", {}));

export const getMe = () => request(api.get("/auth/me")).then((r) => r.data);

/* ------------------------------- dashboard ------------------------------- */
export const getDashboardStats = () =>
  request(api.get("/dashboard/stats")).then((r) => r.data);

export const getRevenueDetails = () =>
  request(api.get("/dashboard/revenue")).then((r) => r.data);

export const getAnalytics = () =>
  request(api.get("/analytics")).then((r) => r.data);

/* Live activity feed — poll with the last-seen id for near-real-time updates. */
export const getRecentActivity = (after = 0) =>
  request(api.get(`/activity/recent?after=${after || 0}`)).then((r) => r.data);

/* ------------------------------- resources ------------------------------- */
export const getResources = () =>
  request(api.get("/resources")).then((r) => r.data || []);

export const getResourceMeta = (resource) =>
  request(api.get(`/resources/${resource}/meta`)).then((r) => r.data);

// {id, label} pairs for FK dropdowns.
export const getRefOptions = (resource, labelField) =>
  request(
    api.get(`/resources/${resource}/options?label=${encodeURIComponent(labelField)}`)
  ).then((r) => r.data || []);

export const listResource = (resource, params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  });
  const q = qs.toString();
  return request(api.get(`/resources/${resource}${q ? `?${q}` : ""}`));
};

export const listChildren = (resource, id, child) =>
  request(api.get(`/resources/${resource}/${id}/children/${child}`));

export const getResourceById = (resource, id) =>
  request(api.get(`/resources/${resource}/${id}`)).then((r) => r.data);

export const createResource = (resource, body) =>
  request(api.post(`/resources/${resource}`, body)).then((r) => r.data);

export const updateResource = (resource, id, body) =>
  request(api.put(`/resources/${resource}/${id}`, body)).then((r) => r.data);

export const deleteResource = (resource, id, mode = "soft") =>
  request(api.delete(`/resources/${resource}/${id}?mode=${mode}`));

/* Fetch a generated invoice PDF (binary) and open it in a new tab. */
export const openInvoicePdf = async (invoiceId) => {
  const res = await api.get(`/invoices/${invoiceId}/file`, {
    responseType: "blob",
  });
  if (res.data?.type && res.data.type.indexOf("pdf") === -1) {
    throw new Error("Invoice file is not available");
  }
  const url = window.URL.createObjectURL(res.data);
  window.open(url, "_blank", "noopener");
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
};
