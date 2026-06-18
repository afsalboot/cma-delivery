import api from "@/utils/api";

export const getDashboardData =
  async () => {
    const res = await api.get(
      "/dashboard"
    );

    return res.data;
  };

export const getDailyReport =
  async () => {
    const res = await api.get(
      "/reports/daily"
    );

    return res.data;
  };

export const getMonthlyReport =
  async () => {
    const res = await api.get(
      "/reports/monthly"
    );

    return res.data;
  };

export const getDailyRevenueChart =
  async () => {
    const res = await api.get(
      "/charts/revenue/daily"
    );

    return res.data;
  };

export const getMonthlyRevenueChart =
  async () => {
    const res = await api.get(
      "/charts/revenue/monthly"
    );

    return res.data;
  };