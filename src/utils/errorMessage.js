const fieldLabels = {
  phone: "Phone number",
  name: "Name",
  customerName: "Customer name",
  place: "Place",
  totalAmount: "Amount",
};

const friendlyRequiredMessage = (message) => {
  const pathMatch = message.match(/Path `([^`]+)` is required/i);
  const validationMatch = message.match(/validation failed: ([^:]+):/i);
  const field = pathMatch?.[1] || validationMatch?.[1];

  if (!field) {
    return null;
  }

  const label = fieldLabels[field] || field.replace(/([A-Z])/g, " $1");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} is required`;
};

export const getErrorMessage = (error, fallback = "Something went wrong") => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    (typeof error === "string" ? error : "") ||
    fallback;

  if (/validation failed/i.test(message) || /Path `.*` is required/i.test(message)) {
    return friendlyRequiredMessage(message) || "Please check required fields";
  }

  if (/duplicate key/i.test(message) || /E11000/i.test(message)) {
    return "This record already exists";
  }

  if (message.length > 80) {
    return fallback;
  }

  return message;
};
