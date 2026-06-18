import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";
import Customer from "@/server/models/Customer";

export async function GET(request) {
  try {
    await connectDB();

    const search =
      request.nextUrl.searchParams.get("q") || "";

    const customers = await Customer.find({
      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    })
      .limit(10)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: customers,
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
}