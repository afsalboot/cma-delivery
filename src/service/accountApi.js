import api from "@/utils/api";

export const getAccounts = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const response = await api.get(`/accounts?${params.toString()}`);

  return response.data;
};
