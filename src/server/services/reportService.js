import Delivery from "../models/Delivery";

const DELIVERY_BOY_PAYOUT_PER_ORDER = 10;

const getDeliveryBoyPayoutSummary = async () => {
  const payoutSummary = await Delivery.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: {
          $sum: 1,
        },
        paidOrders: {
          $sum: {
            $cond: ["$deliveryBoyPayoutPaid", 1, 0],
          },
        },
        pendingOrders: {
          $sum: {
            $cond: ["$deliveryBoyPayoutPaid", 0, 1],
          },
        },
        paidPayout: {
          $sum: {
            $cond: [
              "$deliveryBoyPayoutPaid",
              {
                $ifNull: [
                  "$deliveryBoyPayoutAmount",
                  DELIVERY_BOY_PAYOUT_PER_ORDER,
                ],
              },
              0,
            ],
          },
        },
        pendingPayout: {
          $sum: {
            $cond: [
              "$deliveryBoyPayoutPaid",
              0,
              {
                $ifNull: [
                  "$deliveryBoyPayoutAmount",
                  DELIVERY_BOY_PAYOUT_PER_ORDER,
                ],
              },
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalOrders: 1,
        paidOrders: 1,
        pendingOrders: 1,
        payoutPerOrder: {
          $literal: DELIVERY_BOY_PAYOUT_PER_ORDER,
        },
        totalPayout: "$pendingPayout",
        paidPayout: 1,
        pendingPayout: 1,
      },
    },
  ]);

  return payoutSummary[0] || {
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    payoutPerOrder: DELIVERY_BOY_PAYOUT_PER_ORDER,
    totalPayout: 0,
    paidPayout: 0,
    pendingPayout: 0,
  };
};

const generateReport = async (startDate) => {
  const matchPeriod = {
    createdAt: {
      $gte: startDate,
    },
  };
  const [report, paymentBreakdown, deliveryBoyPayout] = await Promise.all([
    Delivery.aggregate([
      {
        $match: matchPeriod,
      },
      {
        $group: {
          _id: null,
          totalOrders: {
            $sum: 1,
          },
          totalRevenue: {
            $sum: "$totalAmount",
          },
          totalCollected: {
            $sum: "$paidAmount",
          },
          totalCredit: {
            $sum: "$creditAmount",
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalRevenue: 1,
          totalCollected: 1,
          totalCredit: 1,
        },
      },
    ]),
    Delivery.aggregate([
      {
        $match: matchPeriod,
      },
      {
        $group: {
          _id: {
            $ifNull: ["$paymentMethod", "PENDING"],
          },
          orders: {
            $sum: 1,
          },
          billed: {
            $sum: "$totalAmount",
          },
          collected: {
            $sum: "$paidAmount",
          },
          credit: {
            $sum: "$creditAmount",
          },
        },
      },
      {
        $project: {
          _id: 0,
          method: "$_id",
          orders: 1,
          billed: 1,
          collected: 1,
          credit: 1,
        },
      },
      {
        $sort: {
          collected: -1,
          billed: -1,
        },
      },
    ]),
    getDeliveryBoyPayoutSummary(),
  ]);

  return {
    ...(report[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalCollected: 0,
      totalCredit: 0,
    }),
    paymentBreakdown,
    deliveryBoyPayout,
  };
};

export const getDailyReportService = async () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return generateReport(today);
};

export const getMonthlyReportService = async () => {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return generateReport(start);
};

export const takeDeliveryBoyPayoutService = async () => {
  const match = {
    deliveryBoyPayoutPaid: {
      $ne: true,
    },
  };

  const pendingOrders = await Delivery.countDocuments(match);

  if (pendingOrders <= 0) {
    return {
      paidOrders: 0,
      paidAmount: 0,
    };
  }

  await Delivery.updateMany(match, {
    $set: {
      deliveryBoyPayoutAmount: DELIVERY_BOY_PAYOUT_PER_ORDER,
      deliveryBoyPayoutPaid: true,
      deliveryBoyPayoutPaidAt: new Date(),
    },
  });

  return {
    paidOrders: pendingOrders,
    paidAmount: pendingOrders * DELIVERY_BOY_PAYOUT_PER_ORDER,
  };
};

export const getDailyRevenueChartService = async () => {
  return await Delivery.aggregate([
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        revenue: {
          $sum: "$totalAmount",
        },
        collected: {
          $sum: "$paidAmount",
        },
        credit: {
          $sum: "$creditAmount",
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        revenue: 1,
        collected: 1,
        credit: 1,
      },
    },
    {
      $sort: {
        date: 1,
      },
    },
  ]);
};

export const getMonthlyRevenueChartService = async () => {
  return await Delivery.aggregate([
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$createdAt",
          },
        },
        revenue: {
          $sum: "$totalAmount",
        },
        collected: {
          $sum: "$paidAmount",
        },
        credit: {
          $sum: "$creditAmount",
        },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        revenue: 1,
        collected: 1,
        credit: 1,
      },
    },
    {
      $sort: {
        month: 1,
      },
    },
  ]);
};
