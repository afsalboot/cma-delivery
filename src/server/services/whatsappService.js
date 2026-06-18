import Delivery from "../models/Delivery";
import {
  formatPaymentMethod,
  formatPaymentStatus,
} from "../../utils/paymentLabels";

const formatMoney = (value) =>
  `INR ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatItem = (item, index) => {
  const details = [
    Number(item.kg || 0) > 0 ? `${item.kg} kg` : null,
    Number(item.quantity || 0) > 1 ? `Qty ${item.quantity}` : null,
    Number(item.pricePerKg || 0) > 0
      ? `${formatMoney(item.pricePerKg)}/kg`
      : null,
  ].filter(Boolean);

  const detailText = details.length > 0 ? ` (${details.join(", ")})` : "";

  return `${index + 1}. ${item.name || "Item"}${detailText} - ${formatMoney(
    item.amount,
  )}`;
};

const getStatusLine = (delivery, balanceDue) => {
  if (delivery.paymentStatus === "PAID") {
    return "Payment received in full. Thank you!";
  }

  if (delivery.paymentStatus === "PARTIAL") {
    return `Balance due: ${formatMoney(balanceDue)}`;
  }

  if (delivery.paymentStatus === "CREDIT") {
    return `Added to store credit: ${formatMoney(
      delivery.creditAmount || balanceDue,
    )}`;
  }

  return `Amount due: ${formatMoney(balanceDue)}`;
};

export const generateWhatsappMessage = async (deliveryId) => {
  const delivery = await Delivery.findById(deliveryId).populate("customer");

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  const totalAmount = Number(delivery.totalAmount || 0);
  const paidAmount = Number(delivery.paidAmount || 0);
  const balanceDue = Math.max(totalAmount - paidAmount, 0);
  const customerCredit = Number(delivery.customerCredit || 0);
  const changeGiven = Number(delivery.changeGiven || 0);
  const itemLines =
    delivery.items?.length > 0
      ? delivery.items.map(formatItem).join("\n")
      : `1. Delivery order - ${formatMoney(totalAmount)}`;
  const placeLine = delivery.place ? `Place: ${delivery.place}\n` : "";
  const customerCreditLine =
    customerCredit > 0
      ? `Customer credit balance: ${formatMoney(customerCredit)}\n`
      : "";
  const changeLine =
    changeGiven > 0 ? `Give change: ${formatMoney(changeGiven)}\n` : "";

  return `*Invoice ${delivery.invoiceNumber}*
Date: ${formatDate(delivery.deliveryDate)}

*Customer*
${delivery.customer.name}
${placeLine}
*Order Details*
${itemLines}

*Payment Summary*
Total: ${formatMoney(totalAmount)}
Paid: ${formatMoney(paidAmount)}
Method: ${formatPaymentMethod(delivery.paymentMethod, "Not recorded")}
Status: ${formatPaymentStatus(delivery.paymentStatus)}
${customerCreditLine}${changeLine}${getStatusLine(delivery, balanceDue)}

Thanks for shopping with us.`;
};
