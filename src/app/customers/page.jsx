"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiEdit2,
  FiMapPin,
  FiPhone,
  FiRefreshCcw,
  FiSearch,
  FiUser,
} from "react-icons/fi";

import {
  getCustomers,
  updateCustomer,
} from "@/service/customerApi";
import { getErrorMessage } from "@/utils/errorMessage";
import PageLoader, { ButtonLoader } from "../components/ui/Loader";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const emptyForm = {
  name: "",
  phone: "",
  place: "",
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to load customers"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadCustomers, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return customers;
    }

    return customers.filter((customer) => {
      return [
        customer.name,
        customer.phone,
        customer.place,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [customers, search]);

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      place: customer.place || "",
    });
  };

  const closeEdit = () => {
    if (saving) {
      return;
    }

    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!editingCustomer?._id) {
      return;
    }

    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    try {
      setSaving(true);
      const updatedCustomer = await updateCustomer(editingCustomer._id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        place: form.place.trim(),
      });

      setCustomers((current) =>
        current.map((customer) =>
          customer._id === updatedCustomer._id ? updatedCustomer : customer,
        ),
      );
      toast.success("Customer updated");
      closeEdit();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to update customer"));
    } finally {
      setSaving(false);
    }
  };

  if (loading && customers.length === 0) {
    return <PageLoader label="Loading customers" />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 text-white sm:space-y-5 sm:px-4 md:px-0 md:pb-0">
      <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <FiUser />
              Customer module
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white sm:text-4xl">
              Customers
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Edit customer name/mobile and open each customer transaction history.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCustomers}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
          >
            <FiRefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
        <label className="relative block">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, mobile, or place"
            className="h-11 w-full rounded-xl border border-white/10 bg-zinc-950/80 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500"
          />
        </label>
      </section>

      {filteredCustomers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center text-sm text-zinc-500">
          No customers found
        </div>
      ) : (
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer._id}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl transition hover:border-emerald-400/30 hover:bg-white/[0.07]"
            >
              <button
                type="button"
                onClick={() => router.push(`/customers/${customer._id}`)}
                className="block w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-white">
                      {customer.name || "Unknown Customer"}
                    </h2>
                    <div className="mt-1.5 space-y-1 text-xs text-zinc-400">
                      <p className="flex items-center gap-2">
                        <FiPhone className="shrink-0 text-zinc-500" size={13} />
                        <span className="truncate">{customer.phone || "-"}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FiMapPin className="shrink-0 text-zinc-500" size={13} />
                        <span className="truncate">{customer.place || "-"}</span>
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-300">
                    {customer.totalOrders || 0} orders
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-2 text-xs">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">Spent</p>
                    <p className="mt-0.5 truncate font-bold text-white">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-xs text-zinc-500">Due</p>
                    <p className="mt-0.5 truncate font-bold text-amber-300">
                      {formatCurrency(customer.totalCredit)}
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openEdit(customer)}
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                <FiEdit2 size={15} />
                Edit
              </button>
            </div>
          ))}
        </section>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/70 px-3 pb-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
          <form
            onSubmit={handleSave}
            className="w-full rounded-3xl border border-white/10 bg-zinc-950 p-4 shadow-2xl sm:max-w-md sm:p-5"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Edit Customer</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Update customer name, mobile, and place.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-400">
                  Name
                </span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none transition focus:border-emerald-500"
                  placeholder="Customer name"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-400">
                  Mobile
                </span>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none transition focus:border-emerald-500"
                  placeholder="Mobile number"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-400">
                  Place
                </span>
                <input
                  value={form.place}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      place: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none transition focus:border-emerald-500"
                  placeholder="Place"
                />
              </label>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="h-11 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-xl bg-emerald-400 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-70"
              >
                {saving ? <ButtonLoader label="Saving" /> : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
