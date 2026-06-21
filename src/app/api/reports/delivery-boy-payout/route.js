import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import { takeDeliveryBoyPayoutService } from "@/server/services/reportService";

export const POST = async (request) => {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const result = await takeDeliveryBoyPayoutService({
      period: body.period,
    });

    return NextResponse.json({
      success: true,
      data: result,
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
