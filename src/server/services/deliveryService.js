import Delivery from "../models/Delivery";
import Customer from "../models/Customer";
import Transaction from "../models/Transaction";
import generateInvoiceNumber from "../utils/generateInvoice";

const toNumber = (value) => Number(value || 0);

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const normalizeItems = (items = []) => {
  return items
    .map((item) => {
      const kg = toNumber(item.kg);
      const quantity = Math.max(1, toNumber(item.quantity) || 1);
      const pricePerKg = toNumber(item.pricePerKg);
      const cuttingCharge = toNumber(item.cuttingCharge);
      const deliveryCharge = toNumber(item.deliveryCharge);
      const amount =
        toNumber(item.amount) ||
        kg * pricePerKg * quantity + cuttingCharge + deliveryCharge;

      return {
        name: item.name?.trim() || "Chicken",
        kg,
        quantity,
        pricePerKg,
        cuttingCharge,
        deliveryCharge,
        amount,
      };
    })
    .filter((item) => item.amount > 0);
};

export const createDeliveryService = async (payload) => {
  let customer = null;
  const phone = payload.phone?.trim();
  const customerName = payload.customerName?.trim();
  const place = payload.place?.trim();
  const normalizedName = normalizeText(customerName);
  const normalizedPlace = normalizeText(place);

  if (phone) {
    customer = await Customer.findOne({
      phone,
    });
  } else {
    customer = await Customer.findOne({
      normalizedName,
      normalizedPlace,
      phone: { $exists: false },
    });
  }

  if (!customer) {
    customer = await Customer.create({
      name: customerName,
      ...(phone ? { phone } : {}),
      place,
      normalizedName,
      normalizedPlace,
    });
  }

  const items = normalizeItems(payload.items);
  const totalAmount =
    items.length > 0
      ? items.reduce((sum, item) => sum + item.amount, 0)
      : toNumber(payload.totalAmount);

  if (totalAmount <= 0) {
    throw new Error("Total amount is required");
  }

  const paymentMode = ["DIRECT", "CREDIT"].includes(payload.paymentMode)
    ? payload.paymentMode
    : "PENDING";
  const paymentMethod = ["CASH", "GPAY"].includes(payload.paymentMethod)
    ? payload.paymentMethod
    : "CASH";
  const isDirectPayment = paymentMode === "DIRECT";
  const isShopCredit = paymentMode === "CREDIT";
  const invoiceNumber = await generateInvoiceNumber();

  const delivery = await Delivery.create({
    invoiceNumber,
    customer: customer._id,
    place,
    totalAmount,
    paidAmount: isDirectPayment ? totalAmount : 0,
    creditAmount: isShopCredit ? totalAmount : 0,
    paymentStatus: isDirectPayment ? "PAID" : "PENDING",
    paymentMethod: isDirectPayment
      ? paymentMethod
      : isShopCredit
        ? "SHOP_CREDIT"
        : null,
    isDelivered: isDirectPayment,
    items,
  });

  customer.totalOrders += 1;
  customer.totalSpent += totalAmount;

  if (isShopCredit) {
    customer.totalCredit = (customer.totalCredit || 0) + totalAmount;
  }

  if (isDirectPayment) {
    await Transaction.create({
      delivery: delivery._id,
      customer: customer._id,
      amount: totalAmount,
      method: paymentMethod,
      type: "PAYMENT",
      notes: "Payment received while creating delivery",
    });
  }

  if (isShopCredit) {
    await Transaction.create({
      delivery: delivery._id,
      customer: customer._id,
      amount: totalAmount,
      method: "SHOP_CREDIT",
      type: "CREDIT",
      notes: "Order created as shop credit",
    });
  }

  await customer.save();

  return delivery.populate("customer");
};

export const getDeliveriesService = async () => {
  return await Delivery.find().populate("customer").sort({
    createdAt: -1,
  });
};

export const getDeliveryByIdService = async (id) => {
  const delivery = await Delivery.findById(id).populate("customer");

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  return delivery;
};

export const updateDeliveryService = async (
  id,
  payload
) => {
  const delivery =
    await Delivery.findById(id);

  if (!delivery) {
    return null;
  }

  delivery.place = payload.place;
  delivery.totalAmount =
    Number(payload.totalAmount);

  delivery.creditAmount = Math.max(
    0,
    delivery.totalAmount -
      (delivery.paidAmount || 0)
  );

  if (
    (delivery.paidAmount || 0) <= 0
  ) {
    delivery.paymentStatus =
      "PENDING";
    delivery.isDelivered = false;
  } else if (
    delivery.paidAmount <
    delivery.totalAmount
  ) {
    delivery.paymentStatus =
      "PARTIAL";
    delivery.isDelivered = false;
  } else {
    delivery.paymentStatus =
      "PAID";
    delivery.isDelivered = true;
  }

  await delivery.save();

  return await Delivery.findById(
    id
  ).populate("customer");
};

export const deleteDeliveryService = async (id) => {
  const delivery = await Delivery.findByIdAndDelete(id);

  if (delivery) {
    await Transaction.deleteMany({
      delivery: id,
    });
  }

  return delivery;
};

export const searchDeliveriesService = async ({
  search,
  status,
  method,
  place,
}) => {
  const query = {};

  if (status) {
    query.paymentStatus = status;
  }

  if (method) {
    query.paymentMethod = method;
  }

  if (place) {
    query.place = place;
  }

  if (search) {
    query.$or = [
      {
        invoiceNumber: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  return await Delivery.find(query).populate("customer").sort({
    createdAt: -1,
  });
};
