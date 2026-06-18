import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  createDeliveryService,
  getDeliveriesService,
} from "@/server/services/deliveryService";

export const GET = async () => {
  try {
    await connectDB();

    const deliveries =
      await getDeliveriesService();

    return NextResponse.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
};

export const POST = async (
  request
) => {
  try {
    await connectDB();

    const body =
      await request.json();

    const delivery =
      await createDeliveryService(
        body
      );

    return NextResponse.json(
      {
        success: true,
        data: delivery,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
};