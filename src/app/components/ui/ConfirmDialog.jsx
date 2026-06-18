"use client";

import { FiAlertTriangle, FiCheck, FiX } from "react-icons/fi";
import { ButtonLoader } from "./Loader";

const toneStyles = {
  danger: {
    icon: "border-red-400/20 bg-red-400/10 text-red-300",
    confirm: "bg-red-500 text-white hover:bg-red-400",
  },
  warning: {
    icon: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    confirm: "bg-amber-400 text-zinc-950 hover:bg-amber-300",
  },
  success: {
    icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    confirm: "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
  },
};

export default function ConfirmDialog({
  open,
  title,
  description,
  children,
  tone = "danger",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  confirmDisabled = false,
  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  const styles = toneStyles[tone] || toneStyles.danger;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
        <div className="border-b border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`rounded-2xl border p-3 ${styles.icon}`}>
                <FiAlertTriangle size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                {description && (
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close dialog"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {children && <div className="space-y-3 p-5">{children}</div>}

        <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-12 rounded-2xl border border-white/10 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles.confirm}`}
          >
            {loading ? (
              <ButtonLoader label="Working" />
            ) : (
              <>
                <FiCheck size={16} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
