import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  addCustomerCreditService,
} from "@/server/services/paymentService";

export const POST = async (
  request
) => {
  try {
    await connectDB();

    const {
      deliveryId,
      paidAmount,
      method,
    } = await request.json();

    if (
      !deliveryId ||
      !paidAmount ||
      !method
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "deliveryId, paidAmount and method are required",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await addCustomerCreditService({
        deliveryId,
        paidAmount,
        method,
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