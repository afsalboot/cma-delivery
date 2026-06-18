"use client";

import {
  FiClock,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
} from "react-icons/fi";

import { formatPaymentMethod } from "@/utils/paymentLabels";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
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

const getStatusMeta = (order) => {
  if (order.paymentMethod === "SHOP_CREDIT") {
    return {
      label: "Credit",
      className: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
    };
  }

  if (order.paymentStatus === "PARTIAL") {
    return {
      label: "Partial",
      className: "bg-orange-400/10 text-orange-300 ring-orange-400/20",
    };
  }

  if (order.paymentStatus === "PAID") {
    return {
      label: "Paid",
      className: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
    };
  }

  return {
    label: "Pending",
    className: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  };
};

const getOrderName = (order) => {
  const firstItem = order.items?.[0]?.name;
  const itemCount = order.items?.length || 0;

  if (!firstItem) {
    return "Delivery order";
  }

  return itemCount > 1 ? `${firstItem} +${itemCount - 1}` : firstItem;
};

export default function OrderCard({
  order,
  showPayButton = false,
  onPayment,
}) {
  const status = getStatusMeta(order);
  const paidAmount = Number(order.paidAmount || 0);
  const dueAmount = Math.max(
    0,
    Number(order.creditAmount || order.totalAmount - paidAmount),
  );

  return (
    <article className="group rounded-2xl border border-white/10 bg-zinc-950/70 p-4 transition hover:border-white/20 hover:bg-zinc-900/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">
              {order.customer?.name || "Unknown Customer"}
            </h3>

            <span
              className={`rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {order.invoiceNumber || "No invoice"} · {getOrderName(order)}
          </p>
        </div>

        <div className="text-right">
          <div className="text-base font-bold text-white">
            {formatCurrency(order.totalAmount)}
          </div>

          {dueAmount > 0 && (
            <div className="text-xs text-orange-300">
              Due {formatCurrency(dueAmount)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <FiPhone className="shrink-0 text-zinc-500" size={13} />
          <span className="truncate">{order.customer?.phone || "-"}</span>
        </div>

        <div className="flex items-center gap-2">
          <FiMapPin className="shrink-0 text-zinc-500" size={13} />
          <span className="truncate">{order.place || "-"}</span>
        </div>

        <div className="flex items-center gap-2">
          <FiClock className="shrink-0 text-zinc-500" size={13} />
          <span>{formatDateTime(order.deliveryDate || order.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          <FiCreditCard className="shrink-0 text-zinc-500" size={13} />
          <span className="truncate">
            {formatPaymentMethod(order.paymentMethod)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <FiShoppingBag size={14} />
          <span>Paid {formatCurrency(paidAmount)}</span>
        </div>

        {showPayButton && (
          <button
            type="button"
            onClick={() => onPayment?.(order)}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Collect
          </button>
        )}
      </div>
    </article>
  );
}
