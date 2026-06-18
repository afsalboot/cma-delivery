import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import { getAccountsService } from "@/server/services/accountService";

export const GET = async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const accounts = await getAccountsService({
      search: searchParams.get("search") || "",
      type: searchParams.get("type") || "",
      method: searchParams.get("method") || "",
      fromDate: searchParams.get("fromDate") || "",
      toDate: searchParams.get("toDate") || "",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 0,
    });

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
};
