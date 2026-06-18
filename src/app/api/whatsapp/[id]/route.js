import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  generateWhatsappMessage,
} from "@/server/services/whatsappService";

export const GET = async (
  _request,
  context
) => {
  try {
    const { id } = await context.params;

    await connectDB();

    const message =
      await generateWhatsappMessage(
        id
      );

    return NextResponse.json({
      success: true,
      message,
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
