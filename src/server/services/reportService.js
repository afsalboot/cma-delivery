import Delivery from "../models/Delivery";

const generateReport = async (startDate) => {
  const [report, paymentBreakdown] = await Promise.all([
    Delivery.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },
        },
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
        $match: {
          createdAt: {
            $gte: startDate,
          },
        },
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
  ]);

  return {
    ...(report[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalCollected: 0,
      totalCredit: 0,
    }),
    paymentBreakdown,
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
