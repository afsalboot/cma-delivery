import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import { markCreditService } from "@/server/services/paymentService";

export const POST = async (request) => {
  try {
    await connectDB();

    const { deliveryId } = await request.json();

    if (!deliveryId) {
      return NextResponse.json(
        {
          success: false,
          message: "deliveryId is required",
        },
        {
          status: 400,
        },
      );
    }

    const delivery = await markCreditService(deliveryId);

    return NextResponse.json(
      {
        success: true,
        data: delivery,
      },
      {
        status: 200,
      },
    );
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
