import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  getDailyRevenueChartService,
} from "@/server/services/reportService";

export const GET = async () => {
  try {
    await connectDB();

    const chart =
      await getDailyRevenueChartService();

    return NextResponse.json({
      success: true,
      data: chart,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
};