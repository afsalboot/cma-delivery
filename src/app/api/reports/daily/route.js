import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import { getDailyReportService } from "@/server/services/reportService";

export const GET = async () => {
  try {
    await connectDB();

    const report = await getDailyReportService();

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
};
