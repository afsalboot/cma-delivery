import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "PAYMENT",
        "PAYMENT_RECEIVED",
        "CREDIT",
        "CUSTOMER_CREDIT",
        "CHANGE_GIVEN",
      ],
      required: true,
    },

    method: {
      type: String,
      enum: ["CASH", "GPAY", "CREDIT", "SHOP_CREDIT", "CUSTOMER_CREDIT"],
      required: true,
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

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
