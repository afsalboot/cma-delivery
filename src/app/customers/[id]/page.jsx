"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiBox,
  FiCreditCard,
  FiFileText,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";

import { getAccounts } from "@/service/accountApi";
import { getCustomer } from "@/service/customerApi";
import { getErrorMessage } from "@/utils/errorMessage";
import { formatPaymentMethod } from "@/utils/paymentLabels";
import PageLoader from "../../components/ui/Loader";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const typeLabels = {
  PAYMENT: "Paid",
  PAYMENT_RECEIVED: "Paid",
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

const getDateKey = (value) => {
  const date = new Date(value);

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const formatDateHeading = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) {
    return "Today";
  }

  if (getDateKey(date) === getDateKey(yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id;
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCustomerHistory = useCallback(async () => {
    if (!customerId) {
      return;
    }

    try {
      setLoading(true);
      const [customerData, accountsData] = await Promise.all([
        getCustomer(customerId),
        getAccounts({
          customerId,
          limit: 0,
        }),
      ]);

      setCustomer(customerData);
      setTransactions(accountsData.data?.transactions || []);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to load customer history"));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadCustomerHistory();
  }, [loadCustomerHistory]);

  const groupedTransactions = useMemo(() => {
    return transactions.reduce((groups, transaction) => {
      const key = getDateKey(transaction.createdAt);
      const currentGroup = groups.at(-1);

      if (!currentGroup || currentGroup.key !== key) {
        groups.push({
          key,
          label: formatDateHeading(transaction.createdAt),
          transactions: [transaction],
        });
      } else {
        currentGroup.transactions.push(transaction);
      }

      return groups;
    }, []);
  }, [transactions]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount || 0);

        acc.total += amount;

        if (["PAYMENT", "PAYMENT_RECEIVED"].includes(transaction.type)) {
          acc.paid += amount;
        }

        if (transaction.type === "CREDIT") {
          acc.credit += amount;
        }

        return acc;
      },
      {
        total: 0,
        paid: 0,
        credit: 0,
      },
    );
  }, [transactions]);

  if (loading && !customer) {
    return <PageLoader label="Loading customer history" />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 text-white sm:space-y-5 sm:px-4 md:px-0 md:pb-0">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
      >
        <FiArrowLeft />
        Back
      </button>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold text-white sm:text-4xl">
              {customer?.name || "Customer"}
            </h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <FiPhone />
                {customer?.phone || "-"}
              </span>
              <span className="inline-flex items-center gap-2">
                <FiMapPin />
                {customer?.place || "-"}
              </span>
            </div>
            <Link
              href={`/deliveries/customer/${customerId}`}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <FiBox size={15} />
              View deliveries
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
            <div className="rounded-xl bg-zinc-950/70 p-4">
              <p className="text-xs text-zinc-500">Transactions</p>
              <p className="mt-1 text-xl font-bold text-white">
                {transactions.length}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-950/70 p-4">
              <p className="text-xs text-zinc-500">Paid</p>
              <p className="mt-1 break-words text-xl font-bold text-emerald-300">
                {formatCurrency(totals.paid)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-950/70 p-4">
              <p className="text-xs text-zinc-500">Credit</p>
              <p className="mt-1 break-words text-xl font-bold text-amber-300">
                {formatCurrency(totals.credit)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-semibold text-white">Transaction History</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Paid, credit, and change entries for this customer.
            </p>
          </div>
          <FiFileText className="text-emerald-300" />
        </div>

        {transactions.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-zinc-500 sm:px-5">
            No transaction history found
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.key}>
              <div className="border-b border-white/10 bg-zinc-950/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300 sm:px-5">
                {group.label}
              </div>

              {group.transactions.map((transaction) => (
                <button
                  key={transaction._id}
                  type="button"
                  onClick={() =>
                    transaction.delivery?._id &&
                    router.push(`/deliveries/${transaction.delivery._id}`)
                  }
                  className="grid w-full gap-3 border-b border-white/5 px-4 py-4 text-left text-sm transition last:border-b-0 hover:bg-white/5 sm:px-5 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-center"
                >
                  <div className="flex justify-between gap-4 lg:block">
                    <span className="text-xs text-zinc-500 lg:hidden">Date</span>
                    <span className="text-right text-zinc-300 lg:block lg:text-left">
                      {formatDateTime(transaction.createdAt)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 lg:block">
                    <span className="text-xs text-zinc-500 lg:hidden">
                      Invoice
                    </span>
                    <span className="text-right text-zinc-400 lg:block lg:text-left">
                      {transaction.delivery?.invoiceNumber || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 lg:block">
                    <span className="text-xs text-zinc-500 lg:hidden">Type</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        typeColors[transaction.type] ||
                        "bg-white/10 text-zinc-300"
                      }`}
                    >
                      {typeLabels[transaction.type] || transaction.type}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 lg:block">
                    <span className="text-xs text-zinc-500 lg:hidden">
                      Method
                    </span>
                    <span className="inline-flex items-center gap-2 text-zinc-400">
                      <FiCreditCard size={14} />
                      {formatPaymentMethod(transaction.method)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 lg:block lg:text-right">
                    <span className="text-xs text-zinc-500 lg:hidden">
                      Amount
                    </span>
                    <span className="font-bold text-white">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
