"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";

import { useDeliveries } from "@/context/DeliveryContext";
import PageLoader from "../../../components/ui/Loader";
import {
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/utils/paymentLabels";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

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

const getStatusClassName = (order) => {
  if (order.paymentMethod === "SHOP_CREDIT") {
    return "bg-yellow-500/15 text-yellow-400";
  }

  if (order.paymentStatus === "PAID") {
    return "bg-emerald-500/15 text-emerald-400";
  }

  if (order.paymentStatus === "PARTIAL") {
    return "bg-amber-500/15 text-amber-400";
  }

  return "bg-blue-500/15 text-blue-400";
};

const getStatusLabel = (order) => {
  if (order.paymentMethod === "SHOP_CREDIT") {
    return "Credit";
  }

  return formatPaymentStatus(order.paymentStatus);
};

const ORDERS_PER_PAGE = 12;

export default function CustomerDeliveriesPage() {
  const router = useRouter();
  const params = useParams();
  const { deliveries, loading } = useDeliveries();
  const [pageState, setPageState] = useState({
    customerId: null,
    page: 1,
  });

  const customerId = params?.id;

  const customerOrders = useMemo(() => {
    return deliveries
      .filter((order) => order.customer?._id === customerId)
      .sort(
        (a, b) =>
          new Date(b.deliveryDate || b.createdAt) -
          new Date(a.deliveryDate || a.createdAt),
      );
  }, [customerId, deliveries]);

  const customer = customerOrders[0]?.customer;
  const totalPages = Math.max(
    1,
    Math.ceil(customerOrders.length / ORDERS_PER_PAGE),
  );
  const requestedPage =
    pageState.customerId === customerId ? pageState.page : 1;
  const activePage = Math.min(requestedPage, totalPages);
  const pageStart = (activePage - 1) * ORDERS_PER_PAGE;
  const paginatedOrders = customerOrders.slice(
    pageStart,
    pageStart + ORDERS_PER_PAGE,
  );
  const pageFirstItem = customerOrders.length === 0 ? 0 : pageStart + 1;
  const pageLastItem = Math.min(
    pageStart + ORDERS_PER_PAGE,
    customerOrders.length,
  );

  const summary = useMemo(() => {
    return customerOrders.reduce(
      (acc, order) => {
        acc.total += Number(order.totalAmount || 0);
        acc.paid += Number(order.paidAmount || 0);
        acc.due += Math.max(
          0,
          Number(order.creditAmount || order.totalAmount - order.paidAmount),
        );

        return acc;
      },
      {
        total: 0,
        paid: 0,
        due: 0,
      },
    );
  }, [customerOrders]);

  if (loading) {
    return <PageLoader label="Loading customer" />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 sm:space-y-5 sm:px-4 md:px-0 md:pb-0">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
      >
        <FiArrowLeft />
        Back
      </button>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold text-white sm:text-4xl">
              {customer?.name || "Customer Orders"}
            </h1>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <FiPhone />
                {customer?.phone || "-"}
              </span>
              <span className="inline-flex items-center gap-2">
                <FiMapPin />
                {customer?.place || customerOrders[0]?.place || "-"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-right max-[420px]:grid-cols-1 max-[420px]:text-left md:min-w-[360px]">
            <div className="rounded-xl bg-zinc-950 px-3 py-3 sm:px-4">
              <p className="text-xs text-zinc-500">Orders</p>
              <p className="mt-1 font-bold text-white">{customerOrders.length}</p>
            </div>
            <div className="rounded-xl bg-zinc-950 px-3 py-3 sm:px-4">
              <p className="text-xs text-zinc-500">Paid</p>
              <p className="mt-1 break-words font-bold text-emerald-400">
                {formatCurrency(summary.paid)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-950 px-3 py-3 sm:px-4">
              <p className="text-xs text-zinc-500">Due</p>
              <p className="mt-1 break-words font-bold text-amber-400">
                {formatCurrency(summary.due)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {customerOrders.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-500">
          No deliveries found for this customer
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="hidden grid-cols-6 border-b border-white/10 px-5 py-3 text-xs font-medium text-zinc-500 md:grid">
            <div>Invoice</div>
            <div>Date</div>
            <div>Place</div>
            <div>Amount</div>
            <div>Payment</div>
            <div>Status</div>
          </div>

          {paginatedOrders.map((order) => (
            <button
              key={order._id}
              type="button"
              onClick={() => router.push(`/deliveries/${order._id}`)}
              className="grid w-full gap-3 border-b border-white/5 px-4 py-4 text-left transition hover:bg-white/5 sm:px-5 md:grid-cols-6 md:items-center"
            >
              <div className="flex items-start justify-between gap-4 md:block">
                <span className="text-xs text-zinc-500 md:hidden">Invoice</span>
                <span className="max-w-[190px] text-right text-sm font-medium text-white md:block md:max-w-none md:text-left">
                  {order.invoiceNumber || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 md:block">
                <span className="text-xs text-zinc-500 md:hidden">Date</span>
                <span className="inline-flex items-center gap-2 text-right text-sm text-zinc-400 md:text-left">
                  <FiCalendar size={14} />
                  {formatDateTime(order.deliveryDate || order.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 md:block">
                <span className="text-xs text-zinc-500 md:hidden">Place</span>
                <span className="max-w-[190px] truncate text-right text-sm text-zinc-400 md:block md:max-w-none md:text-left">
                  {order.place || "-"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 md:block">
                <span className="text-xs text-zinc-500 md:hidden">Amount</span>
                <span className="text-right text-sm font-semibold text-white md:block md:text-left">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 md:block">
                <span className="text-xs text-zinc-500 md:hidden">Payment</span>
                <span className="inline-flex items-center gap-2 text-right text-sm text-zinc-400 md:text-left">
                  <FiCreditCard size={14} />
                  {formatPaymentMethod(order.paymentMethod)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 md:block">
                <span className="text-xs text-zinc-500 md:hidden">Status</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${getStatusClassName(
                    order,
                  )}`}
                >
                  {getStatusLabel(order)}
                </span>
              </div>
            </button>
          ))}

          <div className="flex flex-col gap-3 px-4 py-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>
              Showing {pageFirstItem}-{pageLastItem} of {customerOrders.length} deliveries
            </span>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setPageState((current) => ({
                    customerId,
                    page: Math.max(
                      1,
                      Math.min(
                        current.customerId === customerId ? current.page : 1,
                        totalPages,
                      ) - 1,
                    ),
                  }))
                }
                disabled={activePage === 1}
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
                onClick={() =>
                  setPageState((current) => ({
                    customerId,
                    page: Math.min(
                      totalPages,
                      Math.min(
                        current.customerId === customerId ? current.page : 1,
                        totalPages,
                      ) + 1,
                    ),
                  }))
                }
                disabled={activePage === totalPages}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <FiChevronRight />
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
