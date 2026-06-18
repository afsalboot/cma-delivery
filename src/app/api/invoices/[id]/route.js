import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  getInvoiceService,
} from "@/server/services/invoiceService";

export const GET = async (
  request,
  context
) => {
  try {
    const { id } = await context.params;

    await connectDB();

    const invoice =
      await getInvoiceService(
        id
      );

    return NextResponse.json({
      success: true,
      data: invoice,
    });
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
