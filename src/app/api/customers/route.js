import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  createCustomerService,
  getCustomersService,
  mergeDuplicateCustomersService,
} from "@/server/services/customerService";

export const GET = async () => {
  try {
    await connectDB();

    const customers = await getCustomersService();

    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

export const POST = async (request) => {
  try {
    await connectDB();

    const body = await request.json();

    const customer = await createCustomerService(body);

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

export const PATCH = async () => {
  try {
    await connectDB();

    const result = await mergeDuplicateCustomersService();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
