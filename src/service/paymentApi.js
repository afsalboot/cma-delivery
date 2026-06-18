import api from "@/utils/api";

export const receivePayment = async (
  payload
) => {
  const { data } = await api.post(
    "/payments",
    payload
  );

  return data;
};

export const markCredit = async (
  deliveryId
) => {
  const { data } = await api.post(
    "/payments/credit",
    {
      deliveryId,
    }
  );

  return data;
};

export const createCustomerCredit =
  async (payload) => {
    const { data } = await api.post(
      "/payments/customer-credit",
      payload
    );

    return data;
  };

export const applyCustomerCredit =
  async (payload) => {
    const { data } = await api.post(
      "/payments/use-customer-credit",
      payload
    );

    return data;
  };

export const settleCustomerCredit =
  async (payload) => {
    const { data } = await api.post(
      "/payments/settle-customer-credit",
      payload
    );

    return data;
  };
