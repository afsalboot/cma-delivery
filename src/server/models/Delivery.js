import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Chicken",
    },

    kg: {
      type: Number,
      default: 0,
    },

    quantity: {
      type: Number,
      default: 1,
    },

    pricePerKg: {
      type: Number,
      default: 0,
    },

    cuttingCharge: {
      type: Number,
      default: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
    },

    amount: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const DeliverySchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    deliveryDate: {
      type: Date,
      default: Date.now,
    },

    place: {
      type: String,
      required: true,
    },

    items: [ItemSchema],

    totalAmount: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    creditAmount: {
      type: Number,
      default: 0,
    },

    customerCredit: {
      type: Number,
      default: 0,
    },

    changeGiven: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "CASH",
        "GPAY",
        "CREDIT",
        "SHOP_CREDIT",
        "CUSTOMER_CREDIT",
        "MIXED",
      ],
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "PARTIAL", "CREDIT"],
      default: "PENDING",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Delivery ||
  mongoose.model("Delivery", DeliverySchema);
