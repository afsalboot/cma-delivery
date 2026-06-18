"use client";

import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 px-4 py-2">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-13 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
              <Image
                src="/Logo.png"
                alt="CMA Delivery logo"
                fill
                priority
                sizes="52px"
                className="object-contain p-1"
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-white">
                CMA Delivery
              </h1>

              <p className="truncate text-xs text-zinc-400">
                Manage Deliveries
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
