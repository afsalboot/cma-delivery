import api from "@/utils/api";

export const getDeliveries =
  async () => {
    const res =
      await api.get(
        "/deliveries"
      );

    return res.data;
  };

export const getDelivery =
  async (id) => {
    const res =
      await api.get(
        `/deliveries/${id}`
      );

    return res.data;
  };

export const createDelivery =
  async (payload) => {
    const res =
      await api.post(
        "/deliveries",
        payload
      );

    return res.data;
  };

export const updateDelivery =
  async (
    id,
    payload
  ) => {
    const res =
      await api.put(
        `/deliveries/${id}`,
        payload
      );

    return res.data;
  };

export const deleteDelivery =
  async (id) => {
    const res =
      await api.delete(
        `/deliveries/${id}`
      );

    return res.data;
  };