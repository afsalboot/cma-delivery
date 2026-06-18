import Delivery from "../models/Delivery";

export const getInvoiceService = async (
  deliveryId
) => {
  const delivery =
    await Delivery.findById(deliveryId)
      .populate("customer");

  if (!delivery) {
    throw new Error(
      "Delivery not found"
    );
  }

  return {
    invoiceNumber:
      delivery.invoiceNumber,

    customerName:
      delivery.customer.name,

    phone:
      delivery.customer.phone,

    place:
      delivery.place,

    date:
      delivery.deliveryDate,

    items:
      delivery.items,

    totalAmount:
      delivery.totalAmount,

    paidAmount:
      delivery.paidAmount,

    creditAmount:
      delivery.creditAmount,

    paymentStatus:
      delivery.paymentStatus,

    paymentMethod:
      delivery.paymentMethod,
  };
};