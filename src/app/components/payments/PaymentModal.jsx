"use client";

import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiCornerUpLeft,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiUser,
  FiX,
} from "react-icons/fi";
import { SiGooglepay } from "react-icons/si";
import { ButtonLoader } from "../ui/Loader";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) =>
  currencyFormatter.format(Number(value || 0));

const methodTone = {
  CASH: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
  GPAY: "border-sky-400/50 bg-sky-400/10 text-sky-200",
  SHOP_CREDIT: "border-amber-400/50 bg-amber-400/10 text-amber-200",
  CUSTOMER_CREDIT: "border-violet-400/50 bg-violet-400/10 text-violet-200",
};

const SummaryRow = ({ label, value, valueClassName = "text-white" }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="min-w-0 text-zinc-500">{label}</span>
    <span className={`shrink-0 font-medium ${valueClassName}`}>{value}</span>
  </div>
);

const MethodButton = ({ item, active, onClick }) => {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-16 rounded-xl border p-3 text-left transition sm:min-h-24 sm:rounded-2xl ${
        active
          ? methodTone[item.value]
          : "border-white/10 bg-zinc-950 text-zinc-300 hover:border-white/20 hover:bg-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Icon size={20} />
        {active && <FiCheck size={16} />}
      </div>

      <div className="mt-2 text-sm font-semibold sm:mt-3">{item.label}</div>
      <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
        {item.helper}
      </div>
    </button>
  );
};

export default function PaymentModal({
  open,
  order,
  onClose,
  onSubmit,
  loading = false,
}) {
  const totalAmount = Number(order?.totalAmount || 0);
  const alreadyPaid = Number(order?.paidAmount || 0);
  const dueAmount = Math.max(
    0,
    Number(order?.creditAmount ?? totalAmount - alreadyPaid),
  );
  const payableAmount = dueAmount > 0 ? dueAmount : totalAmount;
  const customerCreditBalance = Number(
    order?.customer?.customerCreditBalance || 0,
  );
  const previousShopCredit = Number(order?.customer?.totalCredit || 0);
  const orderCustomerCredit = Number(order?.customerCredit || 0);
  const usableCustomerCredit = Math.min(customerCreditBalance, payableAmount);
  const canUseCustomerCredit = usableCustomerCredit > 0;
  const creditAlerts = [
    previousShopCredit > 0
      ? {
          label: "Previous shop credit",
          value: formatCurrency(previousShopCredit),
          helper: "Customer already owes the shop",
          className: "text-amber-200",
        }
      : null,
    customerCreditBalance > 0
      ? {
          label: "Customer credit balance",
          value: formatCurrency(customerCreditBalance),
          helper: "Shop owes this balance to customer",
          className: "text-violet-200",
        }
      : null,
    orderCustomerCredit > 0
      ? {
          label: "Order change pending",
          value: formatCurrency(orderCustomerCredit),
          helper: "Give change or settle this order credit",
          className: "text-sky-200",
        }
      : null,
  ].filter(Boolean);

  const [method, setMethod] = useState("CASH");
  const [receivedAmount, setReceivedAmount] = useState(payableAmount);
  const [extraAction, setExtraAction] = useState("CHANGE");
  const [stateOrderId, setStateOrderId] = useState(order?._id);

  if (open && order?._id && stateOrderId !== order._id) {
    setStateOrderId(order._id);
    setMethod("CASH");
    setExtraAction("CHANGE");
    setReceivedAmount(payableAmount);
  }

  const paymentMethods = useMemo(
    () => [
      {
        value: "CASH",
        label: "Cash",
        icon: FiDollarSign,
        helper: "Money received now",
      },
      {
        value: "GPAY",
        label: "GPay",
        icon: SiGooglepay,
        helper: "Online transfer",
      },
      {
        value: "SHOP_CREDIT",
        label: "Pay Later",
        icon: FiFileText,
        helper: "Customer owes shop",
      },
      ...(canUseCustomerCredit
        ? [
            {
              value: "CUSTOMER_CREDIT",
              label: "Use Credit",
              icon: FiCreditCard,
              helper: `${formatCurrency(usableCustomerCredit)} available`,
            },
          ]
        : []),
    ],
    [canUseCustomerCredit, usableCustomerCredit],
  );

  const displayReceivedAmount =
    method === "CUSTOMER_CREDIT"
      ? usableCustomerCredit
      : method === "SHOP_CREDIT"
        ? 0
        : Number(receivedAmount || 0);

  const difference = useMemo(() => {
    return Number(displayReceivedAmount || 0) - Number(payableAmount || 0);
  }, [displayReceivedAmount, payableAmount]);

  const remainingDue = Math.max(payableAmount - displayReceivedAmount, 0);
  const extraAmount = Math.max(displayReceivedAmount - payableAmount, 0);
  const isPartialCashPayment =
    method !== "CUSTOMER_CREDIT" &&
    method !== "SHOP_CREDIT" &&
    displayReceivedAmount > 0 &&
    displayReceivedAmount < payableAmount;
  const canSubmit =
    method === "SHOP_CREDIT" ||
    method === "CUSTOMER_CREDIT" ||
    displayReceivedAmount > 0;

  const handleMethodChange = (nextMethod) => {
    setMethod(nextMethod);

    if (nextMethod === "CUSTOMER_CREDIT") {
      setReceivedAmount(usableCustomerCredit);
      return;
    }

    if (nextMethod === "SHOP_CREDIT") {
      setReceivedAmount(0);
      return;
    }

    setReceivedAmount(payableAmount);
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit({
      method,
      receivedAmount: displayReceivedAmount,
      extraAction,
      totalAmount: payableAmount,
      deliveryId: order._id,
      customerId: order.customer?._id,
      creditAmount: usableCustomerCredit,
    });
  };

  if (!open || !order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-3">
      <div className="flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl lg:grid lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="max-h-[42dvh] shrink-0 overflow-y-auto border-b border-white/10 bg-white/[0.03] p-4 sm:max-h-none sm:p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-300">
                Receive Payment
              </p>
              <h2 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">
                {formatCurrency(payableAmount)}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">Amount due now</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close payment modal"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-zinc-950 p-3 sm:mt-6 sm:space-y-3 sm:p-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="rounded-xl bg-white/10 p-2 text-zinc-300">
                <FiUser size={16} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {order.customer?.name || "Unknown Customer"}
                </div>
                <div className="text-xs text-zinc-500">
                  {order.customer?.phone || "-"}
                </div>
              </div>
            </div>

            <SummaryRow label="Invoice" value={order.invoiceNumber || "-"} />
            <SummaryRow label="Order total" value={formatCurrency(totalAmount)} />
            <SummaryRow
              label="Already paid"
              value={formatCurrency(alreadyPaid)}
              valueClassName="text-emerald-300"
            />
            <SummaryRow
              label="Customer credit"
              value={formatCurrency(customerCreditBalance)}
              valueClassName={
                customerCreditBalance > 0 ? "text-violet-300" : "text-white"
              }
            />
            <SummaryRow
              label="Previous credit"
              value={formatCurrency(previousShopCredit)}
              valueClassName={
                previousShopCredit > 0 ? "text-amber-300" : "text-white"
              }
            />
          </div>

          {creditAlerts.length > 0 && (
            <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 sm:mt-4 sm:p-4">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="mt-0.5 shrink-0 text-amber-300" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-amber-100">
                    Credit alert
                  </div>
                  <div className="mt-3 space-y-3">
                    {creditAlerts.map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                      >
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${item.className}`}>
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {item.helper}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-white sm:text-right">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-950 p-3 sm:mt-4 sm:p-4">
            <SummaryRow label="Bill amount" value={formatCurrency(payableAmount)} />
            <div className="mt-3">
              <SummaryRow
                label={method === "CUSTOMER_CREDIT" ? "Credit used" : "Received"}
                value={formatCurrency(displayReceivedAmount)}
                valueClassName="text-white"
              />
            </div>
            <div className="mt-3 border-t border-white/10 pt-3">
              {extraAmount > 0 ? (
                <SummaryRow
                  label={extraAction === "CHANGE" ? "Give change" : "Add credit"}
                  value={formatCurrency(extraAmount)}
                  valueClassName={
                    extraAction === "CHANGE"
                      ? "text-emerald-300"
                      : "text-sky-300"
                  }
                />
              ) : (
                <SummaryRow
                  label={remainingDue > 0 ? "Remaining due" : "Balance"}
                  value={formatCurrency(remainingDue)}
                  valueClassName={
                    remainingDue > 0 ? "text-orange-300" : "text-emerald-300"
                  }
                />
              )}
            </div>
          </div>
        </aside>

        <section className="min-h-0 flex flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-4 sm:p-5">
            <div>
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Payment method
                </h3>
                <span className="text-xs text-zinc-500">
                  Pick how this order is handled
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                {paymentMethods.map((item) => (
                  <MethodButton
                    key={item.value}
                    item={item}
                    active={method === item.value}
                    onClick={() => handleMethodChange(item.value)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5">
              {method === "CUSTOMER_CREDIT" ? (
                <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
                  <div className="flex items-start gap-3">
                    <FiCreditCard className="mt-0.5 text-violet-300" />
                    <div>
                      <div className="text-sm font-semibold text-violet-100">
                        Using customer credit
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">
                        {formatCurrency(usableCustomerCredit)} will be applied to
                        this bill.
                      </p>
                    </div>
                  </div>
                </div>
              ) : method === "SHOP_CREDIT" ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="mt-0.5 text-amber-300" />
                    <div>
                      <div className="text-sm font-semibold text-amber-100">
                        Mark as pay later
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">
                        No money is collected now. This amount stays due from the
                        customer.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">
                    Amount received
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                      INR
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={receivedAmount}
                      onChange={(event) =>
                        setReceivedAmount(Number(event.target.value) || 0)
                      }
                      className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 pl-14 pr-4 text-xl font-bold text-white outline-none transition focus:border-emerald-400 sm:h-14 sm:text-2xl"
                    />
                  </div>

                  {isPartialCashPayment && (
                    <p className="mt-2 text-xs text-orange-300">
                      This will record a partial payment and keep{" "}
                      {formatCurrency(remainingDue)} due.
                    </p>
                  )}
                </div>
              )}
            </div>

            {extraAmount > 0 && method !== "CUSTOMER_CREDIT" && (
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Extra amount
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setExtraAction("CHANGE")}
                    className={`rounded-2xl border p-3 text-left transition sm:p-4 ${
                      extraAction === "CHANGE"
                        ? "border-emerald-400/50 bg-emerald-400/10"
                        : "border-white/10 bg-zinc-950 hover:bg-zinc-900"
                    }`}
                  >
                    <FiCornerUpLeft className="text-emerald-300" size={20} />
                    <div className="mt-3 text-sm font-semibold text-white">
                      Return change
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Give {formatCurrency(extraAmount)} back
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExtraAction("CUSTOMER_CREDIT")}
                    className={`rounded-2xl border p-3 text-left transition sm:p-4 ${
                      extraAction === "CUSTOMER_CREDIT"
                        ? "border-sky-400/50 bg-sky-400/10"
                        : "border-white/10 bg-zinc-950 hover:bg-zinc-900"
                    }`}
                  >
                    <FiCreditCard className="text-sky-300" size={20} />
                    <div className="mt-3 text-sm font-semibold text-white">
                      Customer credit
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Save {formatCurrency(extraAmount)} balance
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 grid grid-cols-2 gap-3 border-t border-white/10 bg-zinc-950/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur sm:px-5 lg:bg-transparent lg:backdrop-blur-none">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-2xl border border-white/10 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 sm:h-12"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !canSubmit}
              className="h-11 rounded-2xl bg-emerald-400 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12"
            >
              {loading ? (
                <ButtonLoader label="Processing" />
              ) : (
                "Complete Payment"
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
