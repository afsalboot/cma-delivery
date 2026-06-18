import Delivery from "../models/Delivery";

export const getDashboardStatsService = async () => {
  const deliveries = await Delivery.find();

  const totalDeliveries = deliveries.length;

  const totalAmount = deliveries.reduce(
    (acc, item) => acc + item.totalAmount,
    0,
  );

  const totalCollected = deliveries.reduce(
    (acc, item) => acc + item.paidAmount,
    0,
  );

  const totalCredit = deliveries.reduce(
    (acc, item) => acc + item.creditAmount,
    0,
  );

  const cashCollection = deliveries
    .filter((item) => item.paymentMethod === "CASH")
    .reduce((acc, item) => acc + item.paidAmount, 0);

  const gpayCollection = deliveries
    .filter((item) => item.paymentMethod === "GPAY")
    .reduce((acc, item) => acc + item.paidAmount, 0);

  return {
    totalDeliveries,
    totalAmount,
    totalCollected,
    totalCredit,
    cashCollection,
    gpayCollection,
  };
};


export const getTodayPendingOrdersService =
  async () => {
    const startOfDay = new Date();

    startOfDay.setHours(0, 0, 0, 0);

    return await Delivery.find({
      createdAt: {
        $gte: startOfDay,
      },
      paymentStatus: "PENDING",
      paymentMethod: {
        $ne: "SHOP_CREDIT",
      },
    })
      .populate("customer")
      .sort({
        createdAt: -1,
      });
  };


  export const getTodayCreditOrdersService =
  async () => {
    const startOfDay = new Date();

    startOfDay.setHours(0, 0, 0, 0);

    return await Delivery.find({
      createdAt: {
        $gte: startOfDay,
      },
      paymentMethod: "SHOP_CREDIT",
    })
      .populate("customer")
      .sort({
        createdAt: -1,
      });
  };


  export const getCustomerCreditOrdersService =
  async () => {
    return await Delivery.find({
      customerCredit: {
        $gt: 0,
      },
    })
      .populate("customer")
      .sort({
        createdAt: -1,
      });
  };
