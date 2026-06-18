import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please add MONGODB_URI");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
    indexesSynced: false,
  };
}

const connectDB = async () => {
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  if (!cached.conn) {
    cached.conn = await cached.promise;
  }

  if (!cached.indexesSynced) {
    const { default: Customer } = await import("../models/Customer");

    await Customer.syncIndexes();
    cached.indexesSynced = true;
  }

  return cached.conn;
};

export default connectDB;
