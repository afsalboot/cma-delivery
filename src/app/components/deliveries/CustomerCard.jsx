"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp, FiEye, FiTrash2 } from "react-icons/fi";
import { SiWhatsapp } from "react-icons/si";

import { formatPaymentMethod } from "@/utils/paymentLabels";

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

const getPaymentMethodMeta = (paymentMethod) => {
  if (paymentMethod === "CASH") {
    return {
      label: "Cash",
      className: "bg-emerald-500/15 text-emerald-400",
    };
  }

  if (paymentMethod === "GPAY") {
    return {
      label: "GPay",
      className: "bg-blue-500/15 text-blue-400",
    };
  }

  if (paymentMethod === "SHOP_CREDIT") {
    return {
      label: "Credit",
      className: "bg-yellow-500/15 text-yellow-400",
    };
  }

  if (paymentMethod === "CUSTOMER_CREDIT") {
    return {
      label: "Customer Credit",
      className: "bg-purple-500/15 text-purple-400",
    };
  }

  return {
    label: "Not paid",
    className: "bg-white/10 text-zinc-300",
  };
};

const getPaymentStatusMeta = (order) => {
  if (order.paymentMethod === "SHOP_CREDIT") {
    return {
      label: "Unpaid",
      className: "bg-red-500/15 text-red-400",
    };
  }

  if (order.paymentStatus === "PAID") {
    return {
      label: "Paid",
      className: "bg-emerald-500/15 text-emerald-400",
    };
  }

  if (order.paymentStatus === "PARTIAL") {
    return {
      label: "Partial",
      className: "bg-amber-500/15 text-amber-400",
    };
  }

  return {
    label: "Pending",
    className: "bg-blue-500/15 text-blue-400",
  };
};

const getOrderLabel = (order) => {
  const firstItemName = order.items?.[0]?.name;
  const itemCount = order.items?.length || 0;

  if (!firstItemName) {
    return "Order";
  }

  if (itemCount <= 1) {
    return firstItemName;
  }

  return `${firstItemName} +${itemCount - 1}`;
};

export default function CustomerCard({
  customer,
  orders = [],
  onView,
  onViewCustomer,
  onDelete,
  onDeleteCustomer,
  onPayment,
  onSettleCustomerCredit,
  onWhatsapp,
}) {
  const [expanded, setExpanded] = useState(false);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.deliveryDate || b.createdAt) -
        new Date(a.deliveryDate || a.createdAt),
    );
  }, [orders]);

  const latestOrder = sortedOrders[0];

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.totalAmount += Number(order.totalAmount || 0);

        if (Number(order.customerCredit || 0) > 0) {
          acc.customerCreditCount += 1;
        }

        if (order.paymentStatus === "PAID") {
          acc.paidCount += 1;
        } else if (order.paymentStatus === "PARTIAL") {
          acc.partialCount += 1;
        } else if (
          order.paymentStatus === "PENDING" &&
          order.paymentMethod !== "SHOP_CREDIT"
        ) {
          acc.pendingCount += 1;
        }

        if (order.paymentMethod === "CUSTOMER_CREDIT") {
          acc.creditCount += 1;
        }

        if (order.paymentMethod === "SHOP_CREDIT") {
          acc.storeCount += 1;
        }

        return acc;
      },
      {
        totalAmount: 0,
        customerCreditCount: 0,
        paidCount: 0,
        partialCount: 0,
        pendingCount: 0,
        creditCount: 0,
        storeCount: 0,
      },
    );
  }, [orders]);

  const customerCreditBalance = Number(customer?.customerCreditBalance || 0);

  const summaryPills = [
    {
      show: summary.customerCreditCount > 0,
      label: `Customer Credit ${summary.customerCreditCount}`,
      className: "bg-purple-500/15 text-purple-400",
    },
    {
      show: summary.partialCount > 0,
      label: `Partial ${summary.partialCount}`,
      className: "bg-amber-500/15 text-amber-400",
    },
    {
      show: summary.paidCount > 0,
      label: `Paid ${summary.paidCount}`,
      className: "bg-emerald-500/15 text-emerald-400",
    },
    {
      show: summary.pendingCount > 0,
      label: `Pending ${summary.pendingCount}`,
      className: "bg-blue-500/15 text-blue-400",
    },
    {
      show: summary.creditCount > 0,
      label: `Used Credit ${summary.creditCount}`,
      className: "bg-fuchsia-500/15 text-fuchsia-400",
    },
    {
      show: summary.storeCount > 0,
      label: `Credit ${summary.storeCount}`,
      className: "bg-yellow-500/15 text-yellow-400",
    },
    {
      show: customerCreditBalance > 0,
      label: `Balance ${formatCurrency(customerCreditBalance)}`,
      className: "bg-violet-500/15 text-violet-400",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b border-white/10 px-3 py-3 lg:grid-cols-7 lg:items-center lg:gap-4 lg:px-5 lg:py-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {customer?.name || "Unknown Customer"}
          </p>
          <p className="truncate text-xs text-zinc-500">{customer?.phone || "-"}</p>
        </div>

        <div className="flex justify-end lg:block">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300 sm:px-3">
            {orders.length} deliver{orders.length === 1 ? "y" : "ies"}
          </span>
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-2 text-sm text-zinc-400 lg:contents">
          <div>
            <span className="block text-[11px] uppercase text-zinc-600 lg:hidden">
              Latest
            </span>
            <span className="block truncate text-xs sm:text-sm">
              {formatDateTime(latestOrder?.deliveryDate || latestOrder?.createdAt)}
            </span>
          </div>

          <div className="min-w-0">
            <span className="block text-[11px] uppercase text-zinc-600 lg:hidden">
              Place
            </span>
            <span className="block truncate text-xs sm:text-sm">
              {latestOrder?.place || "-"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] uppercase text-zinc-600 lg:hidden">
              Total
            </span>
            <span className="block truncate text-xs font-semibold text-white sm:text-sm">
              {formatCurrency(summary.totalAmount)}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex flex-wrap content-start gap-1.5 lg:col-span-1 lg:gap-2">
          {summaryPills
            .filter((pill) => pill.show)
            .map((pill) => (
              <span
                key={pill.label}
                className={`rounded-full px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs ${pill.className}`}
              >
                {pill.label}
              </span>
            ))}

        </div>

        <div className="flex items-center justify-end gap-1.5 lg:gap-2">
          <button
            onClick={() => onDeleteCustomer?.(customer, sortedOrders)}
            className="rounded-lg bg-red-500/15 p-2 text-red-400 transition hover:bg-red-500/25"
            aria-label={`Delete ${customer?.name || "customer"} and all data`}
          >
            <FiTrash2 />
          </button>

          <button
            onClick={() => setExpanded((value) => !value)}
            className="rounded-lg bg-white/5 p-2 transition hover:bg-white/10"
            aria-label={expanded ? "Collapse deliveries" : "Expand deliveries"}
          >
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          <button
            onClick={() => onViewCustomer?.(customer, sortedOrders)}
            className="rounded-lg bg-white/5 p-2 hover:bg-white/10"
            aria-label={`View ${customer?.name || "customer"} deliveries`}
          >
            <FiEye />
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-500 ${
          expanded ? "max-h-[3200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="hidden grid-cols-6 border-b border-white/10 py-3 text-xs text-zinc-500 lg:grid">
            <div>ID</div>
            <div>DATE</div>
            <div>ORDER</div>
            <div>AMOUNT</div>
            <div>PAYMENT</div>
            <div className="text-right">ACTIONS</div>
          </div>

          {sortedOrders.map((order, index) => {
            const paymentMethodMeta = getPaymentMethodMeta(order.paymentMethod);
            const paymentStatusMeta = getPaymentStatusMeta(order);
            const hasCustomerCredit = Number(order.customerCredit || 0) > 0;
            const paidAmount = Number(order.paidAmount || 0);
            const dueAmount = Math.max(
              0,
              Number(order.creditAmount || order.totalAmount - paidAmount),
            );
            const isPartial = order.paymentStatus === "PARTIAL";

            return (
              <div
                key={order?._id || `order-${index}`}
                className="grid gap-3 border-b border-white/5 py-4 transition hover:bg-white/5 lg:grid-cols-6 lg:items-center"
              >
                <div className="flex items-center justify-between gap-3 lg:block">
                  <span className="text-xs text-zinc-500 lg:hidden">ID</span>
                  <span className="truncate text-sm text-zinc-300">
                  {order.invoiceNumber || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 lg:block">
                  <span className="text-xs text-zinc-500 lg:hidden">Date</span>
                  <span className="text-sm text-zinc-400">
                  {formatDateTime(order.deliveryDate || order.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 lg:block">
                  <span className="text-xs text-zinc-500 lg:hidden">Order</span>
                  <span className="truncate text-sm text-zinc-300">
                    {getOrderLabel(order)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 text-sm lg:block">
                  <span className="text-xs text-zinc-500 lg:hidden">Amount</span>
                  <div className="flex flex-col items-end gap-1 lg:items-start">
                  <span className="font-semibold">
                    {formatCurrency(order.totalAmount)}
                  </span>

                  {isPartial && (
                    <>
                      <span className="text-xs text-emerald-400">
                        Paid {formatCurrency(paidAmount)}
                      </span>
                      <span className="text-xs text-amber-400">
                        Due {formatCurrency(dueAmount)}
                      </span>
                    </>
                  )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 lg:justify-start">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${paymentMethodMeta.className}`}
                  >
                    {formatPaymentMethod(order.paymentMethod, paymentMethodMeta.label)}
                  </span>

                  <span
                    className={`rounded-full px-2 py-1 text-xs ${paymentStatusMeta.className}`}
                  >
                    {paymentStatusMeta.label}
                  </span>

                  {hasCustomerCredit && (
                    <span className="rounded-full bg-purple-500/15 px-2 py-1 text-xs text-purple-400">
                      Customer Credit {formatCurrency(order.customerCredit)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {order.paymentStatus !== "PAID" && (
                    <button
                      onClick={() => onPayment?.(order)}
                      className="min-h-9 rounded-lg bg-emerald-500/15 px-3 py-2 text-[12px] text-emerald-400 hover:bg-emerald-500/25"
                    >
                      Pay
                    </button>
                  )}

                  {hasCustomerCredit && (
                    <button
                      onClick={() => onSettleCustomerCredit?.(customer, order)}
                      className="min-h-9 rounded-lg bg-rose-500/15 px-3 py-2 text-[12px] text-rose-300 hover:bg-rose-500/25"
                    >
                      Give Change
                    </button>
                  )}

                  <button
                    onClick={() => onWhatsapp?.(order)}
                    className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400 hover:bg-emerald-500/25"
                    aria-label={`Send ${order.invoiceNumber || "delivery"} on WhatsApp`}
                  >
                    <SiWhatsapp size={14} />
                  </button>

                  <button
                    onClick={() => onView?.(order)}
                    className="rounded-lg bg-white/5 p-2 hover:bg-white/10"
                    aria-label={`View ${order.invoiceNumber || "delivery"}`}
                  >
                    <FiEye size={14} />
                  </button>

                  <button
                    onClick={() => onDelete?.(order)}
                    className="rounded-lg bg-red-500/15 p-2 text-red-400 hover:bg-red-500/25"
                    aria-label={`Delete ${order.invoiceNumber || "delivery"}`}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="mt-3 text-right">
            <button
              onClick={() => setExpanded(false)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Hide deliveries
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
