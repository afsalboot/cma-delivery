"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiFilter,
  FiRefreshCcw,
  FiSearch,
} from "react-icons/fi";

import { getAccounts } from "@/service/accountApi";
import { getErrorMessage } from "@/utils/errorMessage";
import { formatPaymentMethod } from "@/utils/paymentLabels";
import PageLoader from "../components/ui/Loader";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const typeLabels = {
  PAYMENT: "Payment",
  PAYMENT_RECEIVED: "Payment Received",
  CREDIT: "Shop Credit",
  CUSTOMER_CREDIT: "Customer Credit",
  CHANGE_GIVEN: "Change Given",
};

const typeColors = {
  PAYMENT: "bg-emerald-500/15 text-emerald-300",
  PAYMENT_RECEIVED: "bg-emerald-500/15 text-emerald-300",
  CREDIT: "bg-amber-500/15 text-amber-300",
  CUSTOMER_CREDIT: "bg-violet-500/15 text-violet-300",
  CHANGE_GIVEN: "bg-rose-500/15 text-rose-300",
};

const methodOptions = [
  "CASH",
  "GPAY",
  "CREDIT",
  "SHOP_CREDIT",
  "CUSTOMER_CREDIT",
];

const typeOptions = [
  "PAYMENT",
  "CREDIT",
  "CUSTOMER_CREDIT",
  "CHANGE_GIVEN",
];

const ACCOUNTS_PER_PAGE = 10;

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState({
    transactions: [],
    totalCount: 0,
    totalAmount: 0,
    typeSummary: {},
    page: 1,
    limit: ACCOUNTS_PER_PAGE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    method: "",
    fromDate: "",
    toDate: "",
    page: 1,
    limit: ACCOUNTS_PER_PAGE,
  });

  const hasActiveFilters = [
    filters.search,
    filters.type,
    filters.method,
    filters.fromDate,
    filters.toDate,
  ].some(Boolean);

  const summaryCards = useMemo(
    () => [
      {
        label: "Transactions",
        value: accounts.totalCount,
        tone: "text-white",
      },
      {
        label: "Total amount",
        value: formatCurrency(accounts.totalAmount),
        tone: "text-emerald-300",
      },
      {
        label: "Customer credit",
        value: formatCurrency(accounts.typeSummary.CUSTOMER_CREDIT),
        tone: "text-violet-300",
      },
      {
        label: "Shop credit",
        value: formatCurrency(accounts.typeSummary.CREDIT),
        tone: "text-amber-300",
      },
      {
        label: "Change given",
        value: formatCurrency(accounts.typeSummary.CHANGE_GIVEN),
        tone: "text-rose-300",
      },
    ],
    [accounts],
  );

  const loadAccounts = useCallback(async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const response = await getAccounts(nextFilters);

      setAccounts(
        response.data || {
          transactions: [],
          totalCount: 0,
          totalAmount: 0,
          typeSummary: {},
          page: 1,
          limit: ACCOUNTS_PER_PAGE,
          totalPages: 1,
        },
      );
    } catch (loadError) {
      console.error(loadError);
      setError(getErrorMessage(loadError, "Failed to load accounts"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: 1,
    }));
  };

  const updatePage = (page) => {
    setFilters((current) => ({
      ...current,
      page,
    }));
  };

  const resetFilters = () => {
    const nextFilters = {
      search: "",
      type: "",
      method: "",
      fromDate: "",
      toDate: "",
      page: 1,
      limit: ACCOUNTS_PER_PAGE,
    };

    setFilters(nextFilters);
    loadAccounts(nextFilters);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadAccounts(filters);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [filters, loadAccounts]);

  if (loading && accounts.transactions.length === 0) {
    return <PageLoader label="Loading accounts" />;
  }

  const activePage = Number(accounts.page || filters.page || 1);
  const totalPages = Math.max(1, Number(accounts.totalPages || 1));
  const pageSize = Number(accounts.limit || ACCOUNTS_PER_PAGE);
  const pageStart = accounts.totalCount === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const pageLastItem = Math.min(activePage * pageSize, accounts.totalCount);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 text-white sm:space-y-5 sm:px-4 sm:pt-4 md:pb-4">
      <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
        <div>
          <Link
            href="/reports"
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <FiArrowLeft />
            Reports
          </Link>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Accounts
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            All payment, credit, and change transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAccounts()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
        >
          <FiRefreshCcw size={16} />
          Refresh
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <p className="text-xs text-zinc-500">{card.label}</p>
            <p className={`mt-2 break-words text-2xl font-bold ${card.tone}`}>
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <FiFilter className="text-emerald-400" />
          Filters
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
          <label className="relative col-span-2 lg:col-span-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search customer, invoice, notes"
              className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/80 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500"
            />
          </label>

          <select
            value={filters.type}
            onChange={(event) => updateFilter("type", event.target.value)}
            className="h-10 min-w-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:px-3"
          >
            <option value="">All types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type] || type}
              </option>
            ))}
          </select>

          <select
            value={filters.method}
            onChange={(event) => updateFilter("method", event.target.value)}
            className="h-10 min-w-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:px-3"
          >
            <option value="">All methods</option>
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {formatPaymentMethod(method)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => updateFilter("fromDate", event.target.value)}
            className="h-10 min-w-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:px-3"
            aria-label="From date"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => updateFilter("toDate", event.target.value)}
            className="h-10 min-w-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:px-3"
            aria-label="To date"
          />

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 lg:col-span-1"
          >
            <FiRefreshCcw />
            Reset
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <div className="hidden grid-cols-7 border-b border-white/10 px-5 py-3 text-xs font-medium text-zinc-500 lg:grid">
          <div>Date</div>
          <div>Customer</div>
          <div>Invoice</div>
          <div>Type</div>
          <div>Method</div>
          <div>Notes</div>
          <div className="text-right">Amount</div>
        </div>

        {accounts.transactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            No transactions found
          </div>
        ) : (
          accounts.transactions.map((transaction) => (
            <div
              key={transaction._id}
              className="grid gap-3 border-b border-white/5 px-4 py-4 text-sm last:border-b-0 sm:px-5 lg:grid-cols-7 lg:items-center"
            >
              <div className="flex justify-between gap-4 lg:block">
                <span className="text-xs text-zinc-500 lg:hidden">Date</span>
                <span className="text-zinc-300">
                  {formatDateTime(transaction.createdAt)}
                </span>
              </div>

              <div className="flex justify-between gap-4 lg:block">
                <span className="text-xs text-zinc-500 lg:hidden">Customer</span>
                <span className="min-w-0 text-right font-medium text-white lg:block lg:text-left">
                  {transaction.customer?.name || "Unknown"}
                </span>
              </div>

              <div className="flex justify-between gap-4 lg:block">
                <span className="text-xs text-zinc-500 lg:hidden">Invoice</span>
                <span className="text-zinc-400">
                  {transaction.delivery?.invoiceNumber || "-"}
                </span>
              </div>

              <div className="flex justify-between gap-4 lg:block">
                <span className="text-xs text-zinc-500 lg:hidden">Type</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    typeColors[transaction.type] || "bg-white/10 text-zinc-300"
                  }`}
                >
                  {typeLabels[transaction.type] || transaction.type}
                </span>
              </div>

              <div className="flex justify-between gap-4 lg:block">
                <span className="text-xs text-zinc-500 lg:hidden">Method</span>
                <span className="inline-flex items-center gap-2 text-zinc-400">
                  <FiCreditCard size={14} />
                  {formatPaymentMethod(transaction.method)}
                </span>
              </div>

              <div className="flex justify-between gap-4 lg:block">
                <span className="text-xs text-zinc-500 lg:hidden">Notes</span>
                <span className="max-w-[220px] truncate text-right text-zinc-500 lg:block lg:text-left">
                  {transaction.notes || "-"}
                </span>
              </div>

              <div className="flex justify-between gap-4 lg:block lg:text-right">
                <span className="text-xs text-zinc-500 lg:hidden">Amount</span>
                <span className="font-bold text-white">
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      {accounts.totalCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {pageStart}-{pageLastItem} of {accounts.totalCount} transactions
          </span>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => updatePage(Math.max(1, activePage - 1))}
              disabled={activePage === 1 || loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronLeft />
              Prev
            </button>

            <span className="min-w-20 text-center text-xs text-zinc-500">
              Page {activePage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => updatePage(Math.min(totalPages, activePage + 1))}
              disabled={activePage === totalPages || loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
