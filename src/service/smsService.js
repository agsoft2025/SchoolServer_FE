import api from "../lib/axios";

export const getClassGroups = async (locationId) => {
  const res = await api.get("sms/class-groups", {
    params: locationId ? { location_id: locationId } : {},
  });
  return res.data;
};

export const previewSmsRecipients = async (payload) => {
  const res = await api.post("sms/preview", payload);
  return res.data;
};

export const sendSms = async (payload) => {
  const res = await api.post("sms/send", payload);
  return res.data;
};

export const getSmsBatches = async ({ page = 1, limit = 10 } = {}) => {
  const res = await api.get("sms/batches", { params: { page, limit } });
  return res.data;
};

export const getSmsBatchById = async (id) => {
  const res = await api.get(`sms/batches/${id}`);
  return res.data;
};

export const getSmsBatchLogs = async (id, { page = 1, limit = 20, status } = {}) => {
  const res = await api.get(`sms/batches/${id}/logs`, { params: { page, limit, status } });
  return res.data;
};

export const retrySmsFailed = async (id) => {
  const res = await api.post(`sms/batches/${id}/retry-failed`);
  return res.data;
};
