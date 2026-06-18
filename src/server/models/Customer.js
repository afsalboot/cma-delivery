import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedName: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    place: {
      type: String,
      default: "",
    },

    normalizedPlace: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Customer owes shop
    totalCredit: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Shop owes customer
    customerCreditBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalOrders: {
      type: Number,
      default: 0,
    },

    totalSpent: {
      type: Number,
      default: 0,
    },

    lastOrderDate: Date,
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: {
        $type: "string",
      },
    },
  },
);

CustomerSchema.index({
  normalizedName: 1,
  normalizedPlace: 1,
});

if (process.env.NODE_ENV !== "production" && mongoose.models.Customer) {
  mongoose.deleteModel("Customer");
}

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
