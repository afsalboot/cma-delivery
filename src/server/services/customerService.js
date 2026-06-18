import Customer from "../models/Customer";
import Delivery from "../models/Delivery";
import Transaction from "../models/Transaction";

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

export const createCustomerService = async (
  payload
) => {
  const phone = payload.phone?.trim();
  const normalizedName = normalizeText(payload.name);
  const normalizedPlace = normalizeText(payload.place);
  const existingCustomer = phone
    ? await Customer.findOne({
        phone,
      })
    : await Customer.findOne({
        normalizedName,
        normalizedPlace,
        phone: { $exists: false },
      });

  if (existingCustomer) {
    throw new Error(
      "Customer already exists"
    );
  }

  return await Customer.create({
    ...payload,
    phone: phone || undefined,
    normalizedName,
    normalizedPlace,
  });
};

export const getCustomersService =
  async () => {
    return await Customer.find().sort({
      createdAt: -1,
    });
  };

export const getCustomerByIdService =
  async (id) => {
    const customer =
      await Customer.findById(id);

    if (!customer) {
      throw new Error(
        "Customer not found"
      );
    }

    return customer;
  };

export const updateCustomerService =
  async (id, payload) => {
    const customer =
      await Customer.findByIdAndUpdate(
        id,
        payload,
        {
          new: true,
        }
      );

    return customer;
  };

export const deleteCustomerService =
  async (id) => {
    const customer = await Customer.findById(
      id
    );

    if (!customer) {
      return null;
    }

    const deliveries = await Delivery.find({
      customer: id,
    }).select("_id");
    const deliveryIds = deliveries.map((item) => item._id);

    await Transaction.deleteMany({
      $or: [
        { customer: id },
        { delivery: { $in: deliveryIds } },
      ],
    });

    await Delivery.deleteMany({
      customer: id,
    });

    await Customer.findByIdAndDelete(
      id
    );

    return {
      customer,
      deletedDeliveries: deliveryIds.length,
    };
  };

export const mergeDuplicateCustomersService = async () => {
  const customers = await Customer.find().sort({ createdAt: 1 });
  const groups = new Map();

  customers.forEach((customer) => {
    const normalizedName = normalizeText(customer.name);
    const normalizedPlace = normalizeText(customer.place);

    customer.normalizedName = normalizedName;
    customer.normalizedPlace = normalizedPlace;

    const hasPhone = Boolean(customer.phone?.trim());
    const key = hasPhone
      ? `phone:${customer.phone.trim()}`
      : `name-place:${normalizedName}:${normalizedPlace}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(customer);
  });

  let merged = 0;

  for (const group of groups.values()) {
    const [primary, ...duplicates] = group;

    await primary.save();

    for (const duplicate of duplicates) {
      const duplicateDeliveries = await Delivery.find({
        customer: duplicate._id,
      });

      await Delivery.updateMany(
        { customer: duplicate._id },
        { $set: { customer: primary._id } },
      );

      await Transaction.updateMany(
        { customer: duplicate._id },
        { $set: { customer: primary._id } },
      );

      primary.totalOrders += duplicateDeliveries.length;
      primary.totalSpent += duplicateDeliveries.reduce(
        (sum, delivery) => sum + Number(delivery.totalAmount || 0),
        0,
      );
      primary.totalCredit += duplicateDeliveries.reduce((sum, delivery) => {
        return delivery.paymentMethod === "SHOP_CREDIT"
          ? sum + Number(delivery.creditAmount || delivery.totalAmount || 0)
          : sum;
      }, 0);
      primary.customerCreditBalance += Number(
        duplicate.customerCreditBalance || 0,
      );

      await Customer.findByIdAndDelete(duplicate._id);
      merged += 1;
    }

    await primary.save();
  }

  return { merged };
};
