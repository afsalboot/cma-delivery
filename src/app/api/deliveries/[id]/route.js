import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  getDeliveryByIdService,
  updateDeliveryService,
  deleteDeliveryService,
} from "@/server/services/deliveryService";

export const GET = async (_, context) => {
  try {
    const { id } = await context.params;

    await connectDB();

    const delivery = await getDeliveryByIdService(id);

    return NextResponse.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: error.message === "Delivery not found" ? 404 : 500,
      },
    );
  }
};

export const PUT = async (
  request,
  context
) => {
  try {
    const { id } =
      await context.params;

    await connectDB();

    const body =
      await request.json();

    const delivery =
      await updateDeliveryService(
        id,
        body
      );

    if (!delivery) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Delivery not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    console.error(error);

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

export const DELETE = async (_, context) => {
  try {
    await connectDB();

    const { id } = await context.params;

    const deletedDelivery = await deleteDeliveryService(id);

    if (!deletedDelivery) {
      return NextResponse.json(
        { success: false, message: "Delivery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Delivery deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
};
