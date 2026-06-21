import Transaction from "../models/Transaction";
import Delivery from "../models/Delivery";

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const getDateRange = ({ fromDate, toDate }) => {
  const createdAt = {};

  if (fromDate) {
    createdAt.$gte = new Date(`${fromDate}T00:00:00`);
  }

  if (toDate) {
    createdAt.$lte = new Date(`${toDate}T23:59:59`);
  }

  return Object.keys(createdAt).length > 0 ? createdAt : null;
};

const getDeliveryKey = (transaction) =>
  String(transaction.delivery?._id || transaction.delivery || "");

const serializeTransaction = (transaction) =>
  typeof transaction.toObject === "function" ? transaction.toObject() : transaction;

const mergeCustomerCreditTransactions = (transactions) => {
  const paymentDeliveryKeys = new Set(
    transactions
      .filter((transaction) => transaction.type === "PAYMENT")
      .map(getDeliveryKey)
      .filter(Boolean),
  );
  const creditByDelivery = transactions.reduce((acc, transaction) => {
    if (transaction.type !== "CUSTOMER_CREDIT") {
      return acc;
    }

    const deliveryKey = getDeliveryKey(transaction);

    if (deliveryKey) {
      acc.set(deliveryKey, transaction);
    }

    return acc;
  }, new Map());

  return transactions.reduce((items, transaction) => {
    const deliveryKey = getDeliveryKey(transaction);
    const pairedCredit =
      transaction.type === "PAYMENT" && deliveryKey
        ? creditByDelivery.get(deliveryKey)
        : null;

    if (pairedCredit) {
      items.push({
        ...serializeTransaction(transaction),
        customerCreditCreated: Number(pairedCredit.amount || 0),
        customerCreditTransactionId: pairedCredit._id,
        notes: [transaction.notes, pairedCredit.notes]
          .filter(Boolean)
          .join(" · "),
      });
      return items;
    }

    if (
      transaction.type === "CUSTOMER_CREDIT" &&
      deliveryKey &&
      paymentDeliveryKeys.has(deliveryKey)
    ) {
      return items;
    }

    items.push(transaction);
    return items;
  }, []);
};

export const getAccountsService = async ({
  search = "",
  type = "",
  method = "",
  customerId = "",
  fromDate = "",
  toDate = "",
  page = 1,
  limit = 0,
} = {}) => {
  const query = {};
  const dateRange = getDateRange({
    fromDate,
    toDate,
  });

  if (type) {
    query.type = type;
  }

  if (method) {
    query.method = method;
  }

  if (customerId) {
    query.customer = customerId;
  }

  if (dateRange) {
    query.createdAt = dateRange;
  }

  let transactions = await Transaction.find(query)
    .populate("customer")
    .populate("delivery")
    .sort({
      createdAt: -1,
    });

  const shouldIncludeOpenCredits =
    (!type || type === "CREDIT") &&
    (!method || method === "SHOP_CREDIT" || method === "CREDIT");

  if (shouldIncludeOpenCredits) {
    const creditTransactionDeliveryIds = transactions
      .filter((transaction) => transaction.type === "CREDIT")
      .map((transaction) => transaction.delivery?._id || transaction.delivery)
      .filter(Boolean);
    const openCreditQuery = {
      ...(customerId
        ? {
            customer: customerId,
          }
        : {}),
      creditAmount: {
        $gt: 0,
      },
      ...(creditTransactionDeliveryIds.length > 0
        ? {
            _id: {
              $nin: creditTransactionDeliveryIds,
            },
          }
        : {}),
    };

    if (dateRange) {
      openCreditQuery.updatedAt = dateRange;
    }

    const openCreditDeliveries = await Delivery.find(openCreditQuery)
      .populate("customer")
      .sort({
        updatedAt: -1,
      });

    transactions = [
      ...transactions,
      ...openCreditDeliveries.map((delivery) => ({
        _id: `due-${delivery._id}`,
        delivery,
        customer: delivery.customer,
        amount: delivery.creditAmount,
        method: "SHOP_CREDIT",
        type: "CREDIT",
        notes: "Current amount due",
        createdAt: delivery.updatedAt || delivery.createdAt,
        updatedAt: delivery.updatedAt || delivery.createdAt,
      })),
    ].sort((first, second) => {
      return new Date(second.createdAt) - new Date(first.createdAt);
    });
  }

  const normalizedSearch = normalizeText(search);

  if (normalizedSearch) {
    transactions = transactions.filter((transaction) => {
      const searchableText = [
        transaction.customer?.name,
        transaction.customer?.phone,
        transaction.customer?.place,
        transaction.delivery?.invoiceNumber,
        transaction.delivery?.place,
        transaction.type,
        transaction.method,
        transaction.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }

  const typeSummary = transactions.reduce((acc, transaction) => {
    const key = transaction.type || "UNKNOWN";
    acc[key] = (acc[key] || 0) + Number(transaction.amount || 0);
    return acc;
  }, {});

  transactions = mergeCustomerCreditTransactions(transactions);

  const totalAmount = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );

  const parsedPage = Math.max(1, Number(page || 1));
  const parsedLimit = Math.max(0, Number(limit || 0));
  const totalCount = transactions.length;
  const totalPages =
    parsedLimit > 0 ? Math.max(1, Math.ceil(totalCount / parsedLimit)) : 1;
  const activePage = Math.min(parsedPage, totalPages);
  const pageStart = parsedLimit > 0 ? (activePage - 1) * parsedLimit : 0;

  return {
    transactions:
      parsedLimit > 0
        ? transactions.slice(pageStart, pageStart + parsedLimit)
        : transactions,
    totalCount,
    totalAmount,
    typeSummary,
    page: activePage,
    limit: parsedLimit,
    totalPages,
  };
};
