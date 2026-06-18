import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  getDashboardStatsService,
  getTodayPendingOrdersService,
  getTodayCreditOrdersService,
  getCustomerCreditOrdersService,
} from "@/server/services/dashboardService";

export const GET = async () => {
  try {
    await connectDB();

    const [stats, todayPending, todayCredit, customerCredits] =
      await Promise.all([
        getDashboardStatsService(),
        getTodayPendingOrdersService(),
        getTodayCreditOrdersService(),
        getCustomerCreditOrdersService(),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        todayPending,
        todayCredit,
        customerCredits,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
};
