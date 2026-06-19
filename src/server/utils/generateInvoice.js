import Counter from "../models/Counter";
import Delivery from "../models/Delivery";

const getInvoiceSequence = (invoiceNumber) => {
  const match = String(invoiceNumber || "").match(/^INV-(?:\d{12}-)?(\d+)$/);

  return Number(match?.[1] || 0);
};

const generateInvoiceNumber = async () => {
  const counterId = "invoice";
  const invoices = await Delivery.find({
    invoiceNumber: {
      $regex: /^INV-(?:\d{12}-)?\d+$/,
    },
  })
    .select("invoiceNumber")
    .lean();
  const latestSequence = invoices.reduce((highest, invoice) => {
    return Math.max(highest, getInvoiceSequence(invoice.invoiceNumber));
  }, 0);

  const existingCounter = await Counter.findById(counterId).lean();

  if (!existingCounter) {
    try {
      await Counter.create({
        _id: counterId,
        sequence: latestSequence,
      });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }
  } else if (Number(existingCounter.sequence || 0) < latestSequence) {
    await Counter.updateOne(
      {
        _id: counterId,
      },
      {
        $set: {
          sequence: latestSequence,
        },
      },
    );
  }

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      new: true,
      upsert: true,
    },
  );
  const nextSequence = String(counter.sequence).padStart(4, "0");

  return `INV-${nextSequence}`;
};

export default generateInvoiceNumber;
