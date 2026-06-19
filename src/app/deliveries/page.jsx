"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCcw,
  FiSearch,
} from "react-icons/fi";

import { useDeliveries } from "@/context/DeliveryContext";
import { usePayment } from "@/context/PaymentContext";
import {
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/utils/paymentLabels";
import { getErrorMessage } from "@/utils/errorMessage";
import { deleteCustomer } from "@/service/customerApi";
import api from "@/utils/api";

import CustomerCard from "../components/deliveries/CustomerCard";
import PaymentModal from "../components/payments/PaymentModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageLoader from "../components/ui/Loader";

const CUSTOMERS_PER_PAGE = 10;

const getDeliveryDate = (order) => order.deliveryDate || order.createdAt;

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

export default function DeliveriesPage() {
  const router = useRouter();

  const { deliveries, loading, removeDelivery, loadDeliveries } =
    useDeliveries();

  const {
  receivePayment,
  createCustomerCredit,
  applyCustomerCredit,
  markCredit,
  settleCustomerCredit,
  loading: paymentLoading,
} = usePayment();

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    type: null,
    loading: false,
    typedName: "",
  });

  const [filters, setFilters] = useState({
    search: "",
    place: "",
    status: "",
    method: "",
    fromDate: "",
    toDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const updateFilter = (name, value) => {
    setCurrentPage(1);
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setFilters({
      search: "",
      place: "",
      status: "",
      method: "",
      fromDate: "",
      toDate: "",
    });
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      type: "delivery",
      deliveryId: id,
      loading: false,
      typedName: "",
    });
  };

  const closeConfirmDialog = () => {
    if (confirmDialog.loading) {
      return;
    }

    setConfirmDialog({
      type: null,
      loading: false,
      typedName: "",
    });
  };

  const handlePaymentClick = (order) => {
    setSelectedOrder(order);
    setPaymentModalOpen(true);
  };

  const handleCustomerDelete = async (customer, orders = []) => {
    if (!customer?._id) {
      return;
    }

    setConfirmDialog({
      type: "customer",
      customer,
      orders,
      loading: false,
      typedName: "",
    });
  };

  const confirmDeliveryDelete = async () => {
    try {
      setConfirmDialog((current) => ({ ...current, loading: true }));
      await removeDelivery(confirmDialog.deliveryId);
      toast.success("Delivery deleted");
      closeConfirmDialog();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Delete failed"));
      setConfirmDialog((current) => ({ ...current, loading: false }));
    }
  };

  const confirmCustomerDelete = async () => {
    try {
      setConfirmDialog((current) => ({ ...current, loading: true }));
      await deleteCustomer(confirmDialog.customer._id);
      await loadDeliveries();
      toast.success("Customer deleted");
      closeConfirmDialog();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Customer delete failed"));
      setConfirmDialog((current) => ({ ...current, loading: false }));
    }
  };

  const handleWhatsapp = async (order) => {
    const phone = String(order?.customer?.phone || "").replace(/\D/g, "");

    if (!phone) {
      toast.error("Customer phone number is missing");
      return;
    }

    const whatsappWindow = window.open("", "_blank");

    try {
      const { data } = await api.get(`/whatsapp/${order._id}`);
      const message = data?.message || "";
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

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

  const handleSettleCustomerCredit = async (customer, order) => {
    if (!customer?._id || !order?._id) {
      return;
    }

    const orderCredit = Number(order.customerCredit || 0);

    if (orderCredit <= 0) {
      return;
    }

    setConfirmDialog({
      type: "settle",
      customer,
      order,
      amount: orderCredit,
      loading: false,
      typedName: "",
    });
  };

  const confirmSettleCustomerCredit = async () => {
    try {
      setConfirmDialog((current) => ({ ...current, loading: true }));
      await settleCustomerCredit({
        customerId: confirmDialog.customer._id,
        deliveryId: confirmDialog.order._id,
        amount: confirmDialog.amount,
      });

      await loadDeliveries();
      toast.success("Customer credit closed");
      closeConfirmDialog();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to close customer credit"));
      setConfirmDialog((current) => ({ ...current, loading: false }));
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
    // Shop Credit (Pay Later)
    if (method === "SHOP_CREDIT") {
      await markCredit(deliveryId);
    }

    // Customer uses existing credit balance
    else if (method === "CUSTOMER_CREDIT") {
      await applyCustomerCredit({
        customerId,
        deliveryId,
        amount: creditAmount,
      });
    }

    // Exact payment
    else if (receivedAmount === totalAmount) {
      await receivePayment({
        deliveryId,
        amount: totalAmount,
        method,
      });
    }

    // Partial payment
    else if (receivedAmount < totalAmount) {
      await receivePayment({
        deliveryId,
        amount: receivedAmount,
        method,
      });
    }

    // Extra payment
    else {
      if (extraAction === "CHANGE") {
        await receivePayment({
          deliveryId,
          amount: totalAmount,
          method,
          changeGiven:
            receivedAmount - totalAmount,
        });
      } else {
        console.log("CREATE CUSTOMER CREDIT");
        await createCustomerCredit({
          deliveryId,
          paidAmount: receivedAmount,
          method,
        });
      }
    }

    await loadDeliveries();

    setPaymentModalOpen(false);
    setSelectedOrder(null);
    } catch (error) {
      console.error(error);

    toast.error(getErrorMessage(error, "Payment failed"));
  }
};

  const filterOptions = useMemo(() => {
    const places = new Set();
    const statuses = new Set();
    const methods = new Set();

    deliveries.forEach((order) => {
      if (order.place) {
        places.add(order.place);
      }

      if (order.paymentStatus) {
        statuses.add(order.paymentStatus);
      }

      if (order.paymentMethod) {
        methods.add(order.paymentMethod);
      }
    });

    return {
      places: [...places].sort((a, b) => a.localeCompare(b)),
      statuses: [...statuses].sort((a, b) => a.localeCompare(b)),
      methods: [...methods].sort((a, b) => a.localeCompare(b)),
    };
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const fromTime = filters.fromDate
      ? new Date(`${filters.fromDate}T00:00:00`).getTime()
      : null;
    const toTime = filters.toDate
      ? new Date(`${filters.toDate}T23:59:59`).getTime()
      : null;

    return deliveries.filter((order) => {
      const orderDate = new Date(getDeliveryDate(order));
      const orderTime = orderDate.getTime();
      const searchableText = [
        order.invoiceNumber,
        order.place,
        order.paymentStatus,
        order.paymentMethod,
        order.customer?.name,
        order.customer?.phone,
        ...(order.items || []).map((item) => item.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (search && !searchableText.includes(search)) {
        return false;
      }

      if (filters.place && order.place !== filters.place) {
        return false;
      }

      if (filters.status && order.paymentStatus !== filters.status) {
        return false;
      }

      if (filters.method && order.paymentMethod !== filters.method) {
        return false;
      }

      if (fromTime && orderTime < fromTime) {
        return false;
      }

      if (toTime && orderTime > toTime) {
        return false;
      }

      return true;
    });
  }, [deliveries, filters]);

  const dateCustomerGroups = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    [...filteredDeliveries]
      .sort((first, second) => {
        return new Date(getDeliveryDate(second)) - new Date(getDeliveryDate(first));
      })
      .forEach((order, index) => {
        const dateKey = getDateKey(getDeliveryDate(order));
      const customerId = order?.customer?._id || `unknown-${index}`;
        const groupKey = `${dateKey}:${customerId}`;

        if (!groupMap.has(groupKey)) {
          const group = {
            key: groupKey,
            dateKey,
            dateLabel: formatDateHeading(getDeliveryDate(order)),
          customer: order?.customer || {
            _id: customerId,
            name: "Unknown Customer",
            phone: "-",
          },
          orders: [],
          };

          groupMap.set(groupKey, group);
          groups.push(group);
        }

        groupMap.get(groupKey).orders.push(order);
      });

    return groups;
  }, [filteredDeliveries]);

  const totalPages = Math.max(
    1,
    Math.ceil(dateCustomerGroups.length / CUSTOMERS_PER_PAGE),
  );
  const activePage = Math.min(currentPage, totalPages);
  const pageStart = (activePage - 1) * CUSTOMERS_PER_PAGE;
  const paginatedGroups = dateCustomerGroups.slice(
    pageStart,
    pageStart + CUSTOMERS_PER_PAGE,
  );
  const paginatedDateGroups = paginatedGroups.reduce((groups, group) => {
    const currentGroup = groups.at(-1);

    if (!currentGroup || currentGroup.key !== group.dateKey) {
      groups.push({
        key: group.dateKey,
        label: group.dateLabel,
        groups: [group],
      });
    } else {
      currentGroup.groups.push(group);
    }

    return groups;
  }, []);
  const pageFirstItem = dateCustomerGroups.length === 0 ? 0 : pageStart + 1;
  const pageLastItem = Math.min(
    pageStart + CUSTOMERS_PER_PAGE,
    dateCustomerGroups.length,
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const dialogCustomerName =
    confirmDialog.customer?.name || "Unknown Customer";
  const customerNameMatches =
    confirmDialog.typedName.trim() === dialogCustomerName;

  if (loading) {
    return <PageLoader label="Loading deliveries" />;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 sm:space-y-5 sm:px-4 md:px-0 md:pb-0">
        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Deliveries</h1>

          <p className="mt-1 text-zinc-500">
            Manage delivery orders and collect payments.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="inline-flex h-9 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-white">
              <FiFilter className="text-emerald-400" />
              Filters
            </div>

            <div className="shrink-0 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-500">
              {filteredDeliveries.length}/{deliveries.length}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_auto]">
            <label className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search"
                className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/80 pl-9 pr-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 sm:pl-10 sm:pr-3"
              />
            </label>

            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="h-10 min-w-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:px-3"
            >
              <option value="">All status</option>
              {filterOptions.statuses.map((status) => (
                <option key={status} value={status}>
                  {formatPaymentStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={filters.place}
              onChange={(event) => updateFilter("place", event.target.value)}
              className="h-10 min-w-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:px-3"
            >
              <option value="">All places</option>
              {filterOptions.places.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>

            <select
              value={filters.method}
              onChange={(event) => updateFilter("method", event.target.value)}
              className="h-10 min-w-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:px-3"
            >
              <option value="">All methods</option>
              {filterOptions.methods.map((method) => (
                <option key={method} value={method}>
                  {formatPaymentMethod(method)}
                </option>
              ))}
            </select>

            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                From
              </span>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(event) => updateFilter("fromDate", event.target.value)}
                className="h-10 w-full min-w-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:px-3"
                aria-label="From date"
              />
            </label>

            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                To
              </span>
              <input
                type="date"
                value={filters.toDate}
                onChange={(event) => updateFilter("toDate", event.target.value)}
                className="h-10 w-full min-w-0 rounded-lg border border-white/10 bg-zinc-950/80 px-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:px-3"
                aria-label="To date"
              />
            </label>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 lg:col-span-1 lg:self-end"
            >
              <FiRefreshCcw />
              Reset
            </button>
          </div>
        </div>

        {dateCustomerGroups.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-500">
            No deliveries found
          </div>
        ) : (
          <>
            {paginatedDateGroups.map((dateGroup) => (
              <section key={dateGroup.key} className="space-y-3">
                <div className="sticky top-20 z-10 rounded-2xl border border-white/10 bg-zinc-950/90 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300 backdrop-blur-xl">
                  {dateGroup.label}
                </div>

                {dateGroup.groups.map((group) => (
                  <CustomerCard
                    key={group.key}
                    customer={group.customer}
                    orders={group.orders}
                    onViewCustomer={(customer) =>
                      router.push(`/deliveries/customer/${customer._id}`)
                    }
                    onView={(order) => router.push(`/deliveries/${order._id}`)}
                    onDelete={(order) => handleDelete(order._id)}
                    onDeleteCustomer={handleCustomerDelete}
                    onPayment={handlePaymentClick}
                    onSettleCustomerCredit={handleSettleCustomerCredit}
                    onWhatsapp={handleWhatsapp}
                  />
                ))}
              </section>
            ))}

            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {pageFirstItem}-{pageLastItem} of{" "}
                {dateCustomerGroups.length} customer groups
              </span>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, Math.min(page, totalPages) - 1),
                    )
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
                    setCurrentPage((page) =>
                      Math.min(totalPages, Math.min(page, totalPages) + 1),
                    )
                  }
                  disabled={activePage === totalPages}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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

      <ConfirmDialog
        open={confirmDialog.type === "delivery"}
        title="Delete delivery?"
        description="This delivery and its payment records will be permanently removed."
        confirmLabel="Delete Delivery"
        loading={confirmDialog.loading}
        onClose={closeConfirmDialog}
        onConfirm={confirmDeliveryDelete}
      />

      <ConfirmDialog
        open={confirmDialog.type === "customer"}
        title={`Delete ${dialogCustomerName}?`}
        description={`This will permanently delete ${dialogCustomerName}, ${confirmDialog.orders?.length || 0} deliveries, and related payment records.`}
        confirmLabel="Delete Customer"
        loading={confirmDialog.loading}
        confirmDisabled={!customerNameMatches}
        onClose={closeConfirmDialog}
        onConfirm={confirmCustomerDelete}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-400">
            Type customer name to confirm
          </span>
          <input
            value={confirmDialog.typedName}
            onChange={(event) =>
              setConfirmDialog((current) => ({
                ...current,
                typedName: event.target.value,
              }))
            }
            className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-400"
            placeholder={dialogCustomerName}
            autoFocus
          />
        </label>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDialog.type === "settle"}
        title="Give change?"
        description={`Give change ${Number(confirmDialog.amount || 0).toFixed(2)} and close this order customer credit.`}
        tone="warning"
        confirmLabel="Close Credit"
        loading={confirmDialog.loading}
        onClose={closeConfirmDialog}
        onConfirm={confirmSettleCustomerCredit}
      />
    </>
  );
}
