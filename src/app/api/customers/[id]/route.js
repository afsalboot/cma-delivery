import { NextResponse } from "next/server";
import connectDB from "@/server/lib/mongodb";

import {
  getCustomerByIdService,
  updateCustomerService,
  deleteCustomerService,
} from "@/server/services/customerService";

export const GET = async (_, context) => {
  try {
    const { id } = await context.params;

    await connectDB();

    const customer = await getCustomerByIdService(id);

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

export const PUT = async (request, context) => {
  try {
    const { id } = await context.params;

    await connectDB();

    const body = await request.json();

    const customer = await updateCustomerService(id, body);

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

export const DELETE = async (_, context) => {
  try {
    const { id } = await context.params;

    await connectDB();

    await deleteCustomerService(id);

    return NextResponse.json({
      message: "Deleted",
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
