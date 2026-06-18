"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiCalendar,
  FiCreditCard,
  FiEdit3,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";
import { SiWhatsapp } from "react-icons/si";

import { useDashboard } from "@/context/DashboardContext";
import { useDeliveries } from "@/context/DeliveryContext";
import { usePayment } from "@/context/PaymentContext";
import { getErrorMessage } from "@/utils/errorMessage";
import { formatPaymentMethod } from "@/utils/paymentLabels";
import api from "@/utils/api";

import PaymentModal from "../../components/payments/PaymentModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import PageLoader from "../../components/ui/Loader";

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

const SummaryRow = ({ label, value, valueClassName = "text-white" }) => (
  <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 text-sm last:border-b-0">
    <span className="text-zinc-500">{label}</span>
    <span className={`font-semibold ${valueClassName}`}>{value}</span>
  </div>
);

const getStatusMeta = (delivery) => {
  if (delivery.paymentMethod === "SHOP_CREDIT") {
    return {
      label: "Credit",
      className: "bg-yellow-500/15 text-yellow-400",
    };
  }

  if (delivery.paymentStatus === "PAID") {
    return {
      label: "Paid",
      className: "bg-emerald-500/15 text-emerald-400",
    };
  }

  if (delivery.paymentStatus === "PARTIAL") {
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

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { deliveries, loading, loadDeliveries } = useDeliveries();
  const { loadDashboard } = useDashboard();
  const {
    receivePayment,
    createCustomerCredit,
    applyCustomerCredit,
    markCredit,
    settleCustomerCredit,
    loading: paymentLoading,
  } = usePayment();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);

  const delivery = deliveries.find((item) => item._id === id);

  const totals = useMemo(() => {
    const totalAmount = Number(delivery?.totalAmount || 0);
    const paidAmount = Number(delivery?.paidAmount || 0);
    const dueAmount = Math.max(
      0,
      Number(delivery?.creditAmount || totalAmount - paidAmount),
    );

    return {
      totalAmount,
      paidAmount,
      dueAmount,
      customerCredit: Number(delivery?.customerCredit || 0),
      changeGiven: Number(delivery?.changeGiven || 0),
    };
  }, [delivery]);

  const status = delivery ? getStatusMeta(delivery) : null;
  const canCollectPayment =
    delivery && delivery.paymentStatus !== "PAID";
  const canGiveChange =
    delivery && Number(delivery.customerCredit || 0) > 0;

  const handleWhatsapp = async () => {
    const phone = String(delivery?.customer?.phone || "").replace(/\D/g, "");

    if (!phone) {
      toast.error("Customer phone number is missing");
      return;
    }

    const whatsappWindow = window.open("", "_blank");

    try {
      const { data } = await api.get(`/whatsapp/${delivery._id}`);
      const message = data?.message || "";
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
        message,
      )}`;

      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }
    } catch (error) {
      if (whatsappWindow) {
        whatsappWindow.close();
      }

      console.error(error);
      toast.error(getErrorMessage(error, "Failed to open WhatsApp bill"));
    }
  };

  const handleSettleCustomerCredit = async () => {
    if (!delivery?.customer?._id || !delivery?._id) {
      return;
    }

    const orderCredit = Number(delivery.customerCredit || 0);

    if (orderCredit <= 0) {
      return;
    }

    setSettleDialogOpen(true);
  };

  const confirmSettleCustomerCredit = async () => {
    try {
      setSettleLoading(true);
      await settleCustomerCredit({
        customerId: delivery.customer._id,
        deliveryId: delivery._id,
        amount: Number(delivery.customerCredit || 0),
      });

      await Promise.all([loadDeliveries(), loadDashboard()]);
      toast.success("Customer credit closed");
      setSettleDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to close customer credit"));
    } finally {
      setSettleLoading(false);
    }
  };

  const handlePayment = async ({
    deliveryId,
    customerId,
    method,
    receivedAmount,
    totalAmount,
    extraAction,
    creditAmount,
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
        });
      } else if (receivedAmount < totalAmount) {
        await receivePayment({
          deliveryId,
          amount: receivedAmount,
          method,
        });
      } else if (extraAction === "CHANGE") {
        await receivePayment({
          deliveryId,
          amount: totalAmount,
          method,
          changeGiven: receivedAmount - totalAmount,
        });
      } else {
        await createCustomerCredit({
          deliveryId,
          paidAmount: receivedAmount,
          method,
        });
      }

      await Promise.all([loadDeliveries(), loadDashboard()]);

      setPaymentModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Payment failed"));
    }
  };

  if (loading) {
    return <PageLoader label="Loading delivery" />;
  }

  if (!delivery) {
    return (
      <main className="mx-auto max-w-4xl space-y-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <FiArrowLeft />
          Back
        </button>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-500">
          Delivery not found
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <FiArrowLeft />
          Back
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push(`/deliveries/edit/${delivery._id}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <FiEdit3 />
            Edit
          </button>

          <button
            type="button"
            onClick={handleWhatsapp}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <SiWhatsapp />
            WhatsApp
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-white">
                {delivery.invoiceNumber}
              </h1>
              <span className={`rounded-full px-3 py-1 text-xs ${status.className}`}>
                {status.label}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <FiCalendar />
                {formatDateTime(delivery.deliveryDate || delivery.createdAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <FiMapPin />
                {delivery.place || "-"}
              </span>
              <span className="inline-flex items-center gap-2">
                <FiUser />
                {delivery.customer?.name || "Unknown Customer"}
              </span>
              <span className="inline-flex items-center gap-2">
                <FiPhone />
                {delivery.customer?.phone || "-"}
              </span>
            </div>
          </div>

          <div className="grid min-w-full grid-cols-3 gap-3 md:min-w-[360px]">
            <div className="rounded-xl bg-zinc-950 px-4 py-3">
              <p className="text-xs text-zinc-500">Total</p>
              <p className="mt-1 font-bold text-white">
                {formatCurrency(totals.totalAmount)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-950 px-4 py-3">
              <p className="text-xs text-zinc-500">Paid</p>
              <p className="mt-1 font-bold text-emerald-400">
                {formatCurrency(totals.paidAmount)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-950 px-4 py-3">
              <p className="text-xs text-zinc-500">Due</p>
              <p className="mt-1 font-bold text-amber-400">
                {formatCurrency(totals.dueAmount)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <FiShoppingBag className="text-emerald-400" />
            <h2 className="font-semibold text-white">Order Details</h2>
          </div>

          {delivery.items?.length > 0 ? (
            <div>
              <div className="grid grid-cols-5 border-b border-white/10 px-5 py-3 text-xs font-medium text-zinc-500">
                <div>Item</div>
                <div>Kg</div>
                <div>Qty</div>
                <div>Rate</div>
                <div className="text-right">Amount</div>
              </div>

              {delivery.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="grid grid-cols-5 border-b border-white/5 px-5 py-4 text-sm last:border-b-0"
                >
                  <div className="font-medium text-white">
                    {item.name || "Item"}
                  </div>
                  <div className="text-zinc-400">{item.kg || "-"}</div>
                  <div className="text-zinc-400">{item.quantity || "-"}</div>
                  <div className="text-zinc-400">
                    {item.pricePerKg ? formatCurrency(item.pricePerKg) : "-"}
                  </div>
                  <div className="text-right font-semibold text-white">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-sm text-zinc-500">
              No item rows were added. Total amount is recorded for this
              delivery.
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <FiCreditCard className="text-sky-400" />
              <h2 className="font-semibold text-white">Payment Summary</h2>
            </div>

            <SummaryRow
              label="Method"
              value={formatPaymentMethod(delivery.paymentMethod)}
            />
            <SummaryRow label="Status" value={status.label} />
            <SummaryRow
              label="Total amount"
              value={formatCurrency(totals.totalAmount)}
            />
            <SummaryRow
              label="Paid amount"
              value={formatCurrency(totals.paidAmount)}
              valueClassName="text-emerald-400"
            />
            <SummaryRow
              label="Due amount"
              value={formatCurrency(totals.dueAmount)}
              valueClassName={totals.dueAmount > 0 ? "text-amber-400" : "text-white"}
            />
            <SummaryRow
              label="Customer credit"
              value={formatCurrency(totals.customerCredit)}
              valueClassName={
                totals.customerCredit > 0 ? "text-purple-400" : "text-white"
              }
            />
            <SummaryRow
              label="Change given"
              value={formatCurrency(totals.changeGiven)}
              valueClassName={
                totals.changeGiven > 0 ? "text-emerald-400" : "text-white"
              }
            />
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <h2 className="font-semibold text-white">Payment Options</h2>

            <div className="mt-4 grid gap-3">
              {canCollectPayment && (
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(true)}
                  className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Collect Payment
                </button>
              )}

              {canGiveChange && (
                <button
                  type="button"
                  onClick={handleSettleCustomerCredit}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
                >
                  Give Change {formatCurrency(totals.customerCredit)}
                </button>
              )}

              {!canCollectPayment && !canGiveChange && (
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-500">
                  No pending payment action for this order.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <PaymentModal
        key={`${delivery._id}-${paymentModalOpen}`}
        open={paymentModalOpen}
        order={delivery}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePayment}
        loading={paymentLoading}
      />

      <ConfirmDialog
        open={settleDialogOpen}
        title="Give change?"
        description={`Give change ${formatCurrency(totals.customerCredit)} and close this order customer credit.`}
        tone="warning"
        confirmLabel="Close Credit"
        loading={settleLoading}
        onClose={() => setSettleDialogOpen(false)}
        onConfirm={confirmSettleCustomerCredit}
      />
    </main>
  );
}
