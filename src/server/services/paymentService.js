import Delivery from "../models/Delivery";
import Customer from "../models/Customer";
import Transaction from "../models/Transaction";

const syncShopCreditTransaction = async ({ delivery, customer, amount }) => {
  const creditAmount = Math.max(0, Number(amount || 0));
  const query = {
    delivery: delivery._id,
    customer: customer._id,
    type: "CREDIT",
  };

  if (creditAmount <= 0) {
    await Transaction.deleteMany(query);
    return;
  }

  await Transaction.findOneAndUpdate(
    query,
    {
      delivery: delivery._id,
      customer: customer._id,
      amount: creditAmount,
      method: "SHOP_CREDIT",
      type: "CREDIT",
      notes: "Remaining amount due",
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
};

export const receivePaymentService = async ({
  deliveryId,
  amount,
  method,
  changeGiven = 0,
}) => {
  const delivery = await Delivery.findById(deliveryId);

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  const customer = await Customer.findById(delivery.customer);

  if (!customer) {
    throw new Error("Customer not found");
  }

  const previousCreditAmount = Number(delivery.creditAmount || 0);

  delivery.paidAmount = (delivery.paidAmount || 0) + amount;

  delivery.creditAmount = Math.max(
    0,
    delivery.totalAmount - delivery.paidAmount,
  );

  delivery.paymentMethod = method;

  delivery.changeGiven =
    Math.max(0, Number(changeGiven || 0));

  if (delivery.paidAmount <= 0) {
    delivery.paymentStatus = "PENDING";
    delivery.isDelivered = false;
  } else if (delivery.paidAmount < delivery.totalAmount) {
    delivery.paymentStatus = "PARTIAL";
    delivery.isDelivered = false;
  } else {
    delivery.paymentStatus = "PAID";
    delivery.isDelivered = true;
  }

  const creditDifference =
    Number(delivery.creditAmount || 0) - previousCreditAmount;
  customer.totalCredit = Math.max(
    0,
    Number(customer.totalCredit || 0) + creditDifference,
  );

  await Transaction.create({
    delivery: delivery._id,
    customer: customer._id,
    amount,
    method,
    type: "PAYMENT",
    notes:
      delivery.changeGiven > 0
        ? `Give change ${delivery.changeGiven}`
        : "",
  });

  await syncShopCreditTransaction({
    delivery,
    customer,
    amount: delivery.creditAmount,
  });

  await customer.save();
  await delivery.save();

  return delivery;
};

export const addCustomerCreditService = async ({
  deliveryId,
  paidAmount,
  method,
}) => {
  const delivery = await Delivery.findById(deliveryId);

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  const customer = await Customer.findById(delivery.customer);

  if (!customer) {
    throw new Error("Customer not found");
  }

  const extra = paidAmount - delivery.totalAmount;

  if (extra <= 0) {
    throw new Error("No customer credit created");
  }

  // Customer gave full amount + extra
  delivery.paidAmount = paidAmount;

  // Store owes customer this amount
  delivery.customerCredit = extra;

  // Customer owes nothing
  delivery.creditAmount = 0;

  delivery.paymentStatus = "PAID";

  delivery.paymentMethod = method;

  delivery.isDelivered = true;

  // Add credit to customer wallet
  customer.customerCreditBalance =
    (customer.customerCreditBalance || 0) + extra;

  await Transaction.create({
    delivery: delivery._id,
    customer: customer._id,
    amount: paidAmount,
    method,
    type: "PAYMENT",
    notes: `Received ₹${paidAmount}. Created ₹${extra} customer credit.`,
  });

  await Transaction.create({
    delivery: delivery._id,
    customer: customer._id,
    amount: extra,
    method: "CREDIT",
    type: "CUSTOMER_CREDIT",
    notes: "Customer advance balance created",
  });

  await customer.save();

  await delivery.save();

  return delivery;
};

export const customerCreditService = async ({
  customerId,
  deliveryId,
  amount,
}) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  const delivery = await Delivery.findById(deliveryId);

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  if ((customer.customerCreditBalance || 0) < amount) {
    throw new Error("Insufficient customer credit");
  }

  const previousCreditAmount = Number(delivery.creditAmount || 0);

  customer.customerCreditBalance -= amount;

  delivery.paidAmount = (delivery.paidAmount || 0) + amount;

  delivery.creditAmount = Math.max(
    0,
    delivery.totalAmount - delivery.paidAmount,
  );

  delivery.paymentMethod = "CUSTOMER_CREDIT";

  if (delivery.paidAmount >= delivery.totalAmount) {
    delivery.paymentStatus = "PAID";
    delivery.isDelivered = true;
  } else {
    delivery.paymentStatus = "PARTIAL";
    delivery.isDelivered = false;
  }

  const creditDifference =
    Number(delivery.creditAmount || 0) - previousCreditAmount;
  customer.totalCredit = Math.max(
    0,
    Number(customer.totalCredit || 0) + creditDifference,
  );

  await Transaction.create({
    delivery: delivery._id,
    customer: customer._id,
    amount,
    method: "CREDIT",
    type: "CUSTOMER_CREDIT",
    notes: "Customer credit used",
  });

  await syncShopCreditTransaction({
    delivery,
    customer,
    amount: delivery.creditAmount,
  });

  await customer.save();
  await delivery.save();

  return {
    customer,
    delivery,
  };
};

export const settleCustomerCreditService = async ({
  customerId,
  deliveryId,
  amount,
}) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  const delivery = await Delivery.findById(deliveryId);

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  const deliveryCustomerCredit = Number(delivery.customerCredit || 0);
  const availableBalance = Number(customer.customerCreditBalance || 0);
  const settleAmount = Number(amount || deliveryCustomerCredit);

  if (deliveryCustomerCredit <= 0) {
    throw new Error("No customer credit available for this order");
  }

  if (availableBalance <= 0) {
    throw new Error("No customer credit available");
  }

  if (settleAmount <= 0) {
    throw new Error("Invalid settle amount");
  }

  if (settleAmount > deliveryCustomerCredit) {
    throw new Error("Settle amount exceeds order customer credit");
  }

  if (settleAmount > availableBalance) {
    throw new Error("Settle amount exceeds customer credit balance");
  }

  customer.customerCreditBalance = Math.max(
    0,
    availableBalance - settleAmount,
  );

  delivery.customerCredit = Math.max(0, deliveryCustomerCredit - settleAmount);

  await Transaction.create({
    delivery: delivery._id,
    customer: customer._id,
    amount: settleAmount,
    method: "CASH",
    type: "CHANGE_GIVEN",
    notes: "Customer credit settled and closed",
  });

  await customer.save();
  await delivery.save();

  return {
    customer,
    delivery,
    settledAmount: settleAmount,
  };
};

export const markCreditService = async (deliveryId) => {
  const delivery = await Delivery.findById(deliveryId);

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  delivery.paidAmount = 0;

  delivery.creditAmount = delivery.totalAmount;

  delivery.paymentMethod = "SHOP_CREDIT";

  delivery.paymentStatus = "PENDING";

  delivery.isDelivered = false;

  const customer = await Customer.findById(delivery.customer);

  customer.totalCredit = (customer.totalCredit || 0) + delivery.totalAmount;

  await Transaction.create({
    delivery: delivery._id,
    customer: customer._id,
    amount: delivery.totalAmount,
    method: "SHOP_CREDIT",
    type: "CREDIT",
    notes: "Order marked as shop credit",
  });

  await customer.save();

  await delivery.save();

  return delivery;
};
