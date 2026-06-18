import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  receivePaymentService,
  customerCreditService,
} from "@/server/services/paymentService";

import Delivery from "@/server/models/Delivery";

export const POST = async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    console.log("PAYMENT BODY:", body);

    let payment;

    if (body.method === "CUSTOMER_CREDIT") {
      const delivery = await Delivery.findById(
        body.deliveryId
      );

      if (!delivery) {
        throw new Error("Delivery not found");
      }

      payment = await customerCreditService({
        customerId: delivery.customer,
        deliveryId: body.deliveryId,
        amount: body.amount,
      });
    } else {
      payment = await receivePaymentService(
        body
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: payment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PAYMENT API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
};