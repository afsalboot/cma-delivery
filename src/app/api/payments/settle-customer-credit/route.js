import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import { settleCustomerCreditService } from "@/server/services/paymentService";

export const POST = async (request) => {
  try {
    await connectDB();

    const { customerId, deliveryId, amount } = await request.json();

    if (!customerId || !deliveryId) {
      return NextResponse.json(
        {
          success: false,
          message: "customerId and deliveryId are required",
        },
        {
          status: 400,
        },
      );
    }

    const result = await settleCustomerCreditService({
      customerId,
      deliveryId,
      amount,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
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
