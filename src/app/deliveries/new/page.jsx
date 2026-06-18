"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiDollarSign,
  FiSave,
  FiScissors,
  FiUser,
} from "react-icons/fi";

import { useDeliveries } from "@/context/DeliveryContext";
import { searchCustomers } from "@/service/customerApi";
import { getErrorMessage } from "@/utils/errorMessage";
import { ButtonLoader } from "../../components/ui/Loader";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const DELIVERY_CHARGE = 10;

const getCuttingCharge = (chickenCount) => {
  const count = Math.max(0, Number(chickenCount || 0));

  if (count <= 0) {
    return 0;
  }

  return count === 1 ? 13 : 13 + (count - 1) * 11;
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-zinc-400">{label}</span>
    {children}
  </label>
);

const inputClassName =
  "h-12 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500";

export default function NewDelivery() {
  const router = useRouter();
  const { addDelivery } = useDeliveries();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    place: "",
    totalAmount: "",
    kg: "",
    rate: "",
    chickenCount: "1",
  });
  const [amountMode, setAmountMode] = useState("manual");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const kg = Number(form.kg || 0);
  const rate = Number(form.rate || 0);
  const chickenCount = Number(form.chickenCount || 0);
  const cuttingCharge = getCuttingCharge(chickenCount);
  const deliveryCharge = amountMode === "chicken" ? DELIVERY_CHARGE : 0;
  const chickenAmount = kg * rate + cuttingCharge + deliveryCharge;
  const totalAmount =
    amountMode === "chicken" ? chickenAmount : Number(form.totalAmount || 0);
  const previousCredit = Number(selectedCustomer?.totalCredit || 0);
  const customerCreditBalance = Number(
    selectedCustomer?.customerCreditBalance || 0,
  );

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCustomerSearch = async (value) => {
    setForm((current) => ({
      ...current,
      customerName: value,
    }));
    setSelectedCustomer(null);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const result = await searchCustomers(value);
      setSuggestions(result.data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error(error);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setForm((current) => ({
      ...current,
      customerName: customer.name || "",
      phone: customer.phone || "",
      place: customer.place || "",
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (totalAmount <= 0) {
      toast.error("Enter order amount before saving");
      return;
    }

    if (amountMode === "chicken" && (kg <= 0 || rate <= 0 || chickenCount <= 0)) {
      toast.error("Enter kg, rate and chicken count before saving");
      return;
    }

    try {
      setLoading(true);

      await addDelivery({
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        place: form.place.trim(),
        totalAmount,
        items:
          amountMode === "chicken"
            ? [
                {
                  name: "Chicken",
                  kg,
                  quantity: chickenCount,
                  pricePerKg: rate,
                  cuttingCharge,
                  deliveryCharge,
                  amount: totalAmount,
                },
              ]
            : [],
      });

      router.push("/deliveries");
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Save failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-24 sm:space-y-5 sm:px-4 md:px-0 md:pb-0">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <FiArrowLeft />
            Back
          </button>
          <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            New Delivery
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Create a delivery with customer details and order amount.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-left sm:px-5 md:w-auto md:min-w-64 md:text-right">
          <p className="text-xs font-medium text-emerald-200">Order Amount</p>
          <p className="mt-1 break-words text-2xl font-bold text-white sm:text-3xl">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5">
            <div className="mb-5 flex items-center gap-2">
              <FiUser className="text-emerald-400" />
              <h2 className="font-semibold text-white">Customer Details</h2>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Field label="Customer Name">
                  <input
                    value={form.customerName}
                    onChange={(event) => handleCustomerSearch(event.target.value)}
                    required
                    autoComplete="off"
                    className={inputClassName}
                    placeholder="Search or enter customer name"
                  />
                </Field>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
                    {suggestions.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        onClick={() => selectCustomer(customer)}
                        className="w-full border-b border-white/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/5"
                      >
                        <div className="font-medium text-white">
                          {customer.name}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                          {customer.phone && <span>{customer.phone}</span>}
                          {customer.place && <span>{customer.place}</span>}
                          {Number(customer.totalCredit || 0) > 0 && (
                            <span className="text-amber-300">
                              Credit {formatCurrency(customer.totalCredit)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Field label="Phone Number">
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="Optional phone number"
                />
              </Field>

              <Field label="Place">
                <input
                  name="place"
                  value={form.place}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                  placeholder="Delivery place"
                />
              </Field>
            </div>
          </div>

          {(previousCredit > 0 || customerCreditBalance > 0) && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="mt-0.5 shrink-0 text-amber-300" />
                <div>
                  <h2 className="font-semibold text-amber-100">Credit Alert</h2>
                  <div className="mt-3 space-y-2 text-sm">
                    {previousCredit > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-zinc-400">
                          Previous customer due
                        </span>
                        <span className="font-bold text-white">
                          {formatCurrency(previousCredit)}
                        </span>
                      </div>
                    )}
                    {customerCreditBalance > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-zinc-400">
                          Customer credit balance
                        </span>
                        <span className="font-bold text-white">
                          {formatCurrency(customerCreditBalance)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5">
          <div className="mb-5 flex items-center gap-2">
            <FiDollarSign className="text-emerald-400" />
            <h2 className="font-semibold text-white">Order Amount</h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-950 p-1">
              <button
                type="button"
                onClick={() => setAmountMode("manual")}
                className={`h-11 rounded-xl text-sm font-semibold transition ${
                  amountMode === "manual"
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setAmountMode("chicken")}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
                  amountMode === "chicken"
                    ? "bg-emerald-400 text-zinc-950"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FiScissors />
                Chicken
              </button>
            </div>

            {amountMode === "manual" ? (
              <Field label="Amount">
                <input
                  name="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                  placeholder="Enter amount"
                />
              </Field>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Kg">
                    <input
                      name="kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.kg}
                      onChange={handleChange}
                      required
                      className={inputClassName}
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Rate / kg">
                    <input
                      name="rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.rate}
                      onChange={handleChange}
                      required
                      className={inputClassName}
                      placeholder="0"
                    />
                  </Field>
                </div>

                <Field label="Chicken count">
                  <input
                    name="chickenCount"
                    type="number"
                    min="1"
                    step="1"
                    value={form.chickenCount}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                    placeholder="1"
                  />
                </Field>

                <div className="space-y-3 rounded-2xl bg-zinc-950 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-zinc-400">Kg x rate</span>
                    <span className="break-words text-right font-semibold text-white">
                      {formatCurrency(kg * rate)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-zinc-400">Cutting charge</span>
                    <span className="break-words text-right font-semibold text-white">
                      {formatCurrency(cuttingCharge)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-zinc-400">Delivery charge</span>
                    <span className="break-words text-right font-semibold text-white">
                      {formatCurrency(deliveryCharge)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-zinc-950 p-4">
              <span className="text-sm text-zinc-400">Total</span>
              <span className="break-words text-right text-xl font-bold text-white sm:text-2xl">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || totalAmount <= 0}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <ButtonLoader label="Saving" />
              ) : (
                <>
                  <FiSave />
                  Save Delivery
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}
