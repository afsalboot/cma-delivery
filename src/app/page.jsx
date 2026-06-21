"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiMapPin,
  FiPhone,
  FiRefreshCcw,
  FiTruck,
} from "react-icons/fi";

import { useDashboard } from "@/context/DashboardContext";
import { useDeliveries } from "@/context/DeliveryContext";
import { usePayment } from "@/context/PaymentContext";
import { getErrorMessage } from "@/utils/errorMessage";

import OrderCard from "./components/dashboard/OrderCard";
import PaymentModal from "./components/payments/PaymentModal";
import PageLoader, { ButtonLoader } from "./components/ui/Loader";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatCard = ({ label, value, helper, icon: Icon, tone = "zinc" }) => {
  const tones = {
    emerald: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20",
    amber: "text-amber-300 bg-amber-400/10 ring-amber-400/20",
    sky: "text-sky-300 bg-sky-400/10 ring-sky-400/20",
    rose: "text-rose-300 bg-rose-400/10 ring-rose-400/20",
    zinc: "text-zinc-300 bg-white/10 ring-white/10",
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <div className="mt-2 text-2xl font-bold text-white">{value}</div>
        </div>

        <div className={`rounded-xl p-3 ring-1 ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>

      {helper && <p className="mt-3 text-xs text-zinc-500">{helper}</p>}
    </section>
  );
};

const OrderSection = ({ title, count, tone, children, emptyText }) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.04]">
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-zinc-500">Today&apos;s active work</p>
      </div>

      <span
        className={`rounded-full px-3 py-1 text-sm font-semibold ${tone}`}
      >
        {count}
      </span>
    </div>

    <div className="max-h-[560px] space-y-3 overflow-y-auto p-4">
      {count > 0 ? (
        children
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-zinc-500">
          {emptyText}
        </div>
      )}
    </div>
  </section>
);

const CreditCustomerRow = ({ order, amount }) => (
  <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">
          {order.customer?.name || "Unknown Customer"}
        </p>
        <div className="mt-2 grid gap-1 text-xs text-zinc-500">
          <span className="inline-flex min-w-0 items-center gap-2">
            <FiPhone className="shrink-0" />
            <span className="truncate">{order.customer?.phone || "-"}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <FiMapPin className="shrink-0" />
            <span className="truncate">
              {order.customer?.place || order.place || "-"}
            </span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <FiCalendar className="shrink-0" />
            <span className="truncate">
              {formatDate(order.deliveryDate || order.createdAt)}
            </span>
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[11px] uppercase tracking-wide text-zinc-600">
          Amount
        </p>
        <p className="mt-1 font-bold text-white">{formatCurrency(amount)}</p>
      </div>
    </div>
  </div>
);

const CreditDashboardCard = ({
  title,
  helper,
  orders = [],
  tone,
  emptyText,
  getAmount,
}) => {
  const total = orders.reduce((sum, order) => sum + Number(getAmount(order) || 0), 0);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs text-zinc-500">{helper}</p>
        </div>

        <div className="text-right">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>
            {orders.length}
          </span>
          <p className="mt-2 text-sm font-bold text-white">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="max-h-[440px] space-y-3 overflow-y-auto p-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <CreditCustomerRow
              key={order._id}
              order={order}
              amount={getAmount(order)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-zinc-500">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
};

export default function Home() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const {
    stats,
    todayPending,
    todayCredit,
    customerCredits,
    loading,
    loadDashboard,
  } = useDashboard();

  const {
    receivePayment,
    createCustomerCredit,
    applyCustomerCredit,
    markCredit,
    loading: paymentLoading,
  } = usePayment();

  const { loadDeliveries } = useDeliveries();

  const collectionRate = useMemo(() => {
    const totalAmount = Number(stats?.totalAmount || 0);

    if (totalAmount <= 0) {
      return 0;
    }

    return Math.round((Number(stats?.totalCollected || 0) / totalAmount) * 100);
  }, [stats]);

  const pendingTotal = useMemo(() => {
    return (todayPending || []).reduce(
      (sum, order) =>
        sum + Number(order.creditAmount || order.totalAmount || 0),
      0,
    );
  }, [todayPending]);

  const creditTotal = useMemo(() => {
    return (todayCredit || []).reduce(
      (sum, order) =>
        sum + Number(order.creditAmount || order.totalAmount || 0),
      0,
    );
  }, [todayCredit]);

  const handlePaymentClick = (order) => {
    setSelectedOrder(order);
    setPaymentModalOpen(true);
  };

  const handlePayment = async ({
    deliveryId,
    customerId,
    method,
    receivedAmount,
    totalAmount,
    extraAction,
    creditAmount,
    cashAmount,
    gpayAmount,
  }) => {
    try {
      if (method === "SHOP_CREDIT") {
        await markCredit(deliveryId);
      } else if (method === "CUSTOMER_CREDIT") {
        await applyCustomerCredit({
          customerId,
          deliveryId,
          amount: creditAmount,
        });
      } else if (receivedAmount === totalAmount) {
        await receivePayment({
          deliveryId,
          amount: totalAmount,
          method,
          cashAmount,
          gpayAmount,
        });
      } else if (receivedAmount < totalAmount) {
        await receivePayment({
          deliveryId,
          amount: receivedAmount,
          method,
          cashAmount,
          gpayAmount,
        });
      } else if (extraAction === "CHANGE") {
        await receivePayment({
          deliveryId,
          amount: totalAmount,
          method,
          cashAmount,
          gpayAmount,
          changeGiven: receivedAmount - totalAmount,
        });
      } else {
        await createCustomerCredit({
          deliveryId,
          paidAmount: receivedAmount,
          method,
          cashAmount,
          gpayAmount,
        });
      }

      await Promise.all([loadDeliveries(), loadDashboard()]);

      setPaymentModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);

      toast.error(getErrorMessage(error, "Payment failed"));
    }
  };

  if (loading) {
    return <PageLoader label="Loading dashboard" />;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-4 text-white">
      <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-300">
            Delivery Manager
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Payments, pending orders, and credit for today.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard({ showLoading: true })}
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
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Deliveries"
          value={stats?.totalDeliveries || 0}
          helper={`${todayPending?.length || 0} pending today`}
          icon={FiTruck}
          tone="sky"
        />
        <StatCard
          label="Collected"
          value={formatCurrency(stats?.totalCollected)}
          helper={`${collectionRate}% of billed amount`}
          icon={FiCheckCircle}
          tone="emerald"
        />
        <StatCard
          label="Credit"
          value={formatCurrency(stats?.totalCredit)}
          helper={`${formatCurrency(creditTotal)} credit today`}
          icon={FiAlertCircle}
          tone="rose"
        />
        <StatCard
          label="Cash"
          value={formatCurrency(stats?.cashCollection)}
          helper="Cash received"
          icon={FiDollarSign}
          tone="amber"
        />
        <StatCard
          label="GPay"
          value={formatCurrency(stats?.gpayCollection)}
          helper="Online received"
          icon={FiCreditCard}
          tone="sky"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-emerald-500/10 p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-200/80">Collection health</p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {collectionRate}% collected
              </h2>
            </div>

            <FiClock className="text-emerald-200/70" size={28} />
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-emerald-300"
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-zinc-500">Open amount today</p>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(pendingTotal + creditTotal)}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Pending {formatCurrency(pendingTotal)} · Credit{" "}
            {formatCurrency(creditTotal)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <CreditDashboardCard
          title="Credit"
          helper="Customers who purchased on shop credit"
          orders={todayCredit || []}
          tone="bg-amber-400/10 text-amber-300"
          emptyText="No credit purchases today"
          getAmount={(order) => order.creditAmount || order.totalAmount}
        />

        <CreditDashboardCard
          title="Customer Credit"
          helper="Amount to give back or settle with customers"
          orders={customerCredits || []}
          tone="bg-violet-400/10 text-violet-300"
          emptyText="No customer credit pending"
          getAmount={(order) => order.customerCredit}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <OrderSection
          title="Pending Orders"
          count={todayPending?.length || 0}
          tone="bg-sky-400/10 text-sky-300"
          emptyText="No pending orders for today"
        >
          {todayPending?.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              showPayButton
              onPayment={handlePaymentClick}
            />
          ))}
        </OrderSection>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="font-semibold text-white">Credit Summary</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Use the Credit and Customer Credit cards above for customer-wise details.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-zinc-950/70 p-4">
              <p className="text-xs text-zinc-500">Shop credit today</p>
              <p className="mt-1 text-xl font-bold text-amber-300">
                {formatCurrency(creditTotal)}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-950/70 p-4">
              <p className="text-xs text-zinc-500">Customer credit pending</p>
              <p className="mt-1 text-xl font-bold text-violet-300">
                {formatCurrency(
                  (customerCredits || []).reduce(
                    (sum, order) => sum + Number(order.customerCredit || 0),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <PaymentModal
        key={`${selectedOrder?._id}-${paymentModalOpen}`}
        open={paymentModalOpen}
        order={selectedOrder}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedOrder(null);
        }}
        onSubmit={handlePayment}
        loading={paymentLoading}
      />
    </main>
  );
}
