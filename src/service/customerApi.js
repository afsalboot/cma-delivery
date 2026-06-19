import api from "@/utils/api";

export const getCustomers = async () => {
  const { data } = await api.get("/customers");

  return data;
};

export const getCustomer = async (id) => {
  const { data } = await api.get(`/customers/${id}`);

  return data;
};

export const searchCustomers = async (
  query
) => {
  const { data } = await api.get(
    `/customers/search?q=${query}`
  );

  return data;
};

export const updateCustomer = async (id, payload) => {
  const { data } = await api.put(`/customers/${id}`, payload);

  return data;
};

export const deleteCustomer = async (
  id
) => {
  const { data } = await api.delete(
    `/customers/${id}`
  );

  return data;
};
