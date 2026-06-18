export const paymentMethodLabels = {
  CASH: "Cash",
  GPAY: "GPay",
  CREDIT: "Credit",
  SHOP_CREDIT: "Credit",
  CUSTOMER_CREDIT: "Customer Credit",
  MIXED: "Mixed",
};

export const paymentStatusLabels = {
  PENDING: "Pending",
  PAID: "Paid",
  PARTIAL: "Partial",
  CREDIT: "Credit",
};

const fallbackLabel = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  return String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const formatPaymentMethod = (method, fallback = "Not paid") =>
  paymentMethodLabels[method] || fallbackLabel(method, fallback);

export const formatPaymentStatus = (status, fallback = "Pending") =>
  paymentStatusLabels[status] || fallbackLabel(status, fallback);
