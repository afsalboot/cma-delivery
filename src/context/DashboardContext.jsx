"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getDashboardData,
  getDailyReport,
  getMonthlyReport,
  getDailyRevenueChart,
  getMonthlyRevenueChart,
} from "@/service/dashboardApi";

const DashboardContext = createContext(null);

const AUTO_REFRESH_INTERVAL_MS = 15000;

export const DashboardProvider = ({ children }) => {
  const [stats, setStats] = useState(null);

  const [dailyReport, setDailyReport] = useState(null);

  const [monthlyReport, setMonthlyReport] = useState(null);

  const [dailyChart, setDailyChart] = useState([]);

  const [monthlyChart, setMonthlyChart] = useState([]);

  const [todayPending, setTodayPending] = useState([]);

  const [todayCredit, setTodayCredit] = useState([]);

  const [customerCredits, setCustomerCredits] = useState([]);

  const [loading, setLoading] = useState(true);

  const applyDashboardData = ({
    dashboardData,
    dailyData,
    monthlyData,
    dailyChartData,
    monthlyChartData,
  }) => {
    setStats(dashboardData.data.stats);

    setTodayPending(dashboardData.data.todayPending);

    setTodayCredit(dashboardData.data.todayCredit);

    setCustomerCredits(dashboardData.data.customerCredits);

    setDailyReport(dailyData?.data ?? dailyData);

    setMonthlyReport(monthlyData?.data ?? monthlyData);

    setDailyChart(dailyChartData?.data ?? []);

    setMonthlyChart(monthlyChartData?.data ?? []);
  };

  const fetchDashboardData = async () => {
    const [
      dashboardData,
      dailyData,
      monthlyData,
      dailyChartData,
      monthlyChartData,
    ] = await Promise.all([
      getDashboardData(),
      getDailyReport(),
      getMonthlyReport(),
      getDailyRevenueChart(),
      getMonthlyRevenueChart(),
    ]);

    return {
      dashboardData,
      dailyData,
      monthlyData,
      dailyChartData,
      monthlyChartData,
    };
  };

  const loadDashboard = useCallback(async ({
    showLoading = false,
  } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      applyDashboardData(await fetchDashboardData());
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        const data = await fetchDashboardData();

        if (mounted) {
          applyDashboardData(data);
        }
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    };

    const intervalId = window.setInterval(
      refreshIfVisible,
      AUTO_REFRESH_INTERVAL_MS,
    );

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [loadDashboard]);

  return (
    <DashboardContext.Provider
      value={{
        stats,
        todayPending,
        todayCredit,
        customerCredits,
        dailyReport,
        monthlyReport,
        dailyChart,
        monthlyChart,
        loading,
        loadDashboard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }

  return context;
};
