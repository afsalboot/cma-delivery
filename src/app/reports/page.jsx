"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiCreditCard,
  FiDollarSign,
  FiRefreshCcw,
  FiShoppingBag,
  FiTrendingUp,
} from "react-icons/fi";

import { useDashboard } from "@/context/DashboardContext";
import { getAccounts } from "@/service/accountApi";
import PageLoader, { ButtonLoader } from "../components/ui/Loader";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const periodOptions = [
  {
    value: "daily",
    label: "Daily",
    eyebrow: "Today",
    chartLabelKey: "date",
  },
  {
    value: "monthly",
    label: "Monthly",
    eyebrow: "This Month",
    chartLabelKey: "month",
  },
];

const methodLabels = {
  CASH: "Cash",
  GPAY: "GPay",
  CREDIT: "Credit",
  SHOP_CREDIT: "Credit",
  CUSTOMER_CREDIT: "Customer Credit",
  MIXED: "Mixed",
  PENDING: "Pending",
};

const methodColors = {
  CASH: "bg-emerald-300",
  GPAY: "bg-sky-300",
  CREDIT: "bg-amber-300",
  SHOP_CREDIT: "bg-orange-300",
  CUSTOMER_CREDIT: "bg-violet-300",
  MIXED: "bg-fuchsia-300",
  PENDING: "bg-zinc-500",
};

const typeLabels = {
  PAYMENT: "Payment",
  PAYMENT_RECEIVED: "Payment Received",
  CREDIT: "Shop Credit",
  CUSTOMER_CREDIT: "Customer Credit",
  CHANGE_GIVEN: "Change Given",
};

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCollectionRate = (report) => {
  const revenue = Number(report?.totalRevenue || 0);

  if (revenue <= 0) {
    return 0;
  }

  return Math.round((Number(report?.totalCollected || 0) / revenue) * 100);
};

const MetricCard = ({ icon: Icon, label, value, tone = "text-white" }) => (
  <div className="rounded-2xl bg-white/[0.04] p-4">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <Icon className="text-zinc-500" size={17} />
    </div>
    <p className={`mt-2 break-words text-xl font-bold sm:text-2xl ${tone}`}>
      {value}
    </p>
  </div>
);

const PeriodSwitch = ({ value, onChange }) => (
  <div className="grid w-full grid-cols-2 rounded-2xl border border-white/10 bg-zinc-950 p-1 sm:inline-grid sm:w-auto">
    {periodOptions.map((option) => {
      const active = option.value === value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-10 rounded-xl px-4 text-sm font-medium transition ${
            active
              ? "bg-white text-zinc-950"
              : "text-zinc-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

const PaymentBreakdown = ({ data, totalRevenue }) => {
  const maxBilled = Math.max(1, ...data.map((item) => Number(item.billed || 0)));

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/70">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-semibold text-white">Payment Breakdown</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Split by payment method for the selected period
          </p>
        </div>
        <FiCreditCard className="text-sky-300" />
      </div>

      {data.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-zinc-500 sm:px-5">
          No payment data yet
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {data.map((item) => {
            const method = item.method || "PENDING";
            const billed = Number(item.billed || 0);
            const width = Math.max(4, Math.round((billed / maxBilled) * 100));
            const share =
              totalRevenue > 0 ? Math.round((billed / totalRevenue) * 100) : 0;

            return (
              <div key={method} className="px-4 py-4 sm:px-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        methodColors[method] || "bg-zinc-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {methodLabels[method] || method}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {formatNumber(item.orders)} orders · {share}% of billed
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-right text-xs sm:min-w-80 sm:gap-4">
                    <div className="rounded-xl bg-white/[0.03] p-2 sm:bg-transparent sm:p-0">
                      <p className="text-zinc-500">Billed</p>
                      <p className="mt-1 break-words font-semibold text-white">
                        {formatCurrency(billed)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-2 sm:bg-transparent sm:p-0">
                      <p className="text-zinc-500">Collected</p>
                      <p className="mt-1 break-words font-semibold text-emerald-300">
                        {formatCurrency(item.collected)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-2 sm:bg-transparent sm:p-0">
                      <p className="text-zinc-500">Credit</p>
                      <p className="mt-1 break-words font-semibold text-amber-300">
                        {formatCurrency(item.credit)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className={`h-full rounded-full ${
                      methodColors[method] || "bg-zinc-400"
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-white">{label}</p>
      {payload.map((item) => (
        <div
          key={item.dataKey}
          className="flex min-w-36 items-center justify-between gap-4 text-xs"
        >
          <span style={{ color: item.color }}>{item.name}</span>
          <span className="font-semibold text-white">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const RevenueChart = ({ data }) => (
  <section className="rounded-2xl border border-white/10 bg-zinc-950/70">
    <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
      <div>
        <h2 className="font-semibold text-white">Payment Chart</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Billed, collected, and credit trend
        </p>
      </div>
      <FiBarChart2 className="text-emerald-300" />
    </div>

    {data.length === 0 ? (
      <div className="px-4 py-12 text-center text-sm text-zinc-500 sm:px-5">
        No chart data yet
      </div>
    ) : (
      <div className="h-64 px-1 py-4 sm:h-80 sm:px-3 sm:py-5">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              tickFormatter={(value) => `₹${Number(value || 0) / 1000}k`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ color: "#d4d4d8", fontSize: 12 }} />
            <Bar
              dataKey="revenue"
              name="Billed"
              fill="#38bdf8"
              radius={[6, 6, 0, 0]}
              maxBarSize={42}
            />
            <Line
              type="monotone"
              dataKey="collected"
              name="Collected"
              stroke="#6ee7b7"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="credit"
              name="Credit"
              stroke="#fcd34d"
              strokeWidth={3}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )}
  </section>
);

const ReportSummary = ({ label, report }) => {
  const collectionRate = getCollectionRate(report);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold text-white">{label} Summary</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {collectionRate}% collection rate
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900 sm:w-56">
          <div
            className="h-full rounded-full bg-emerald-300"
            style={{ width: `${Math.min(collectionRate, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <MetricCard
          icon={FiShoppingBag}
          label="Orders"
          value={formatNumber(report?.totalOrders)}
        />
        <MetricCard
          icon={FiTrendingUp}
          label="Billed"
          value={formatCurrency(report?.totalRevenue)}
          tone="text-sky-300"
        />
        <MetricCard
          icon={FiDollarSign}
          label="Collected"
          value={formatCurrency(report?.totalCollected)}
          tone="text-emerald-300"
        />
        <MetricCard
          icon={FiCreditCard}
          label="Credit"
          value={formatCurrency(report?.totalCredit)}
          tone="text-amber-300"
        />
      </div>
    </section>
  );
};

const AccountsPreview = ({ transactions = [] }) => (
  <section className="rounded-2xl border border-white/10 bg-zinc-950/70">
    <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
      <div>
        <h2 className="font-semibold text-white">Accounts</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Latest payment and credit transactions
        </p>
      </div>

      <Link
        href="/accounts"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
      >
        Show all
        <FiArrowRight />
      </Link>
    </div>

    {transactions.length === 0 ? (
      <div className="px-4 py-12 text-center text-sm text-zinc-500 sm:px-5">
        No transactions yet
      </div>
    ) : (
      <div className="divide-y divide-white/5">
        {transactions.map((transaction) => (
          <div
            key={transaction._id}
            className="grid gap-3 px-4 py-4 text-sm sm:px-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-white">
                {transaction.customer?.name || "Unknown Customer"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatDateTime(transaction.createdAt)}
              </p>
            </div>

            <div className="text-xs text-zinc-400">
              {transaction.delivery?.invoiceNumber || "-"}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-300">
                {typeLabels[transaction.type] || transaction.type}
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                {methodLabels[transaction.method] || transaction.method}
              </span>
            </div>

            <div className="font-bold text-white md:text-right">
              {formatCurrency(transaction.amount)}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default function ReportsPage() {
  const {
    dailyReport,
    monthlyReport,
    dailyChart,
    monthlyChart,
    loading,
    loadDashboard,
  } = useDashboard();
  const [period, setPeriod] = useState("daily");
  const [accountTransactions, setAccountTransactions] = useState([]);

  const loadAccountPreview = useCallback(async () => {
    try {
      const response = await getAccounts({
        limit: 5,
      });

      setAccountTransactions(response.data?.transactions || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const activePeriod = periodOptions.find((item) => item.value === period);
  const activeReport = period === "daily" ? dailyReport : monthlyReport;
  const activeChart = period === "daily" ? dailyChart : monthlyChart;
  const totalRevenue = Number(activeReport?.totalRevenue || 0);

  const chartData = useMemo(
    () =>
      (activeChart || []).slice(-12).map((item) => ({
        ...item,
        label: item[activePeriod.chartLabelKey],
        revenue: Number(item.revenue || 0),
        collected: Number(item.collected || 0),
        credit: Number(item.credit || 0),
      })),
    [activeChart, activePeriod.chartLabelKey],
  );

  const breakdownData = useMemo(
    () =>
      (activeReport?.paymentBreakdown || []).map((item) => ({
        ...item,
        billed: Number(item.billed || 0),
        collected: Number(item.collected || 0),
        credit: Number(item.credit || 0),
      })),
    [activeReport],
  );

  useEffect(() => {
    loadAccountPreview();

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        loadAccountPreview();
      }
    };

    const intervalId = window.setInterval(refreshIfVisible, 15000);

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [loadAccountPreview]);

  if (loading) {
    return <PageLoader label="Loading reports" />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 text-white sm:space-y-5 sm:px-4 sm:pt-4 md:pb-4">
      <header className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <FiActivity />
              Financial report
            </div>
            <h1 className="mt-4 text-2xl font-bold md:text-4xl">
              Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Collection performance, payment split, and revenue movement.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PeriodSwitch value={period} onChange={setPeriod} />
            <button
              type="button"
              onClick={() =>
                Promise.all([
                  loadDashboard({ showLoading: true }),
                  loadAccountPreview(),
                ])
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
            >
              {loading ? (
                <ButtonLoader label="Refreshing" />
              ) : (
                <>
                  <FiRefreshCcw size={16} />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <ReportSummary label={activePeriod.eyebrow} report={activeReport} />

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <PaymentBreakdown data={breakdownData} totalRevenue={totalRevenue} />
        <RevenueChart data={chartData} />
      </section>

      <AccountsPreview transactions={accountTransactions} />
    </main>
  );
}
