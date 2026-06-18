import api from "@/utils/api";

export const searchCustomers = async (
  query
) => {
  const { data } = await api.get(
    `/customers/search?q=${query}`
  );

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
