import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import { customerCreditService } from "@/server/services/paymentService";

export const POST = async (request) => {
  try {
    await connectDB();

    const {
      customerId,
      deliveryId,
      amount,
    } = await request.json();

    if (
      !customerId ||
      !deliveryId ||
      !amount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "customerId, deliveryId and amount are required",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await customerCreditService({
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
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
};