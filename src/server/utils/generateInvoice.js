import Delivery from "../models/Delivery";

const getDateTimePart = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}`;
};

const generateInvoiceNumber = async () => {
  const dateTimePart = getDateTimePart();
  const prefix = `INV-${dateTimePart}-`;
  const latestInvoice = await Delivery.findOne({
    invoiceNumber: {
      $regex: `^${prefix}\\d{4}$`,
    },
  })
    .sort({
      invoiceNumber: -1,
    })
    .select("invoiceNumber")
    .lean();
  const latestSequence = Number(
    latestInvoice?.invoiceNumber?.split("-").at(-1) || 0,
  );
  const nextSequence = String(latestSequence + 1).padStart(4, "0");

  return `${prefix}${nextSequence}`;
};

export default generateInvoiceNumber;
