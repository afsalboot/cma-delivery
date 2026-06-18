"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDeliveries } from "@/context/DeliveryContext";
import PageLoader, { ButtonLoader } from "../../../components/ui/Loader";

export default function UpdateDelivery() {
  const router = useRouter();
  const { id } = useParams();

  const {
    deliveries,
    editDelivery,
  } = useDeliveries();

  const initialized =
    useRef(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState({
      place: "",
      totalAmount: "",
    });

  const delivery =
    deliveries.find(
      (item) => item._id === id
    );

  useEffect(() => {
    if (
      !delivery ||
      initialized.current
    ) {
      return;
    }

    initialized.current = true;

    setForm({
      place: delivery.place || "",
      totalAmount:
        delivery.totalAmount || "",
    });
  }, [delivery]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      setSaving(true);

      await editDelivery(id, {
        place: form.place,
        totalAmount: Number(
          form.totalAmount
        ),
      });

      router.push(
        "/deliveries"
      );
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!delivery) {
    return <PageLoader label="Loading delivery" />;
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Update Delivery
        </h1>

        <p className="text-zinc-500 mt-1">
          Edit delivery details
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-5"
      >
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Place
          </label>

          <input
            name="place"
            value={form.place}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Total Amount
          </label>

          <input
            name="totalAmount"
            type="number"
            value={form.totalAmount}
            onChange={handleChange}
            required
            min="1"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-white text-black font-semibold py-3 disabled:opacity-50"
        >
          {saving ? (
            <ButtonLoader label="Updating" />
          ) : (
            "Update Delivery"
          )}
        </button>
      </form>
    </div>
  );
}
