"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  FiHome,
  FiPackage,
  FiPlus,
  FiBarChart2,
} from "react-icons/fi";

export default function BottomBar() {
  const pathname =
    usePathname();

  const menus = [
    {
      label: "Home",
      href: "/",
      icon: FiHome,
    },
    {
      label: "Orders",
      href: "/deliveries",
      icon: FiPackage,
    },
    {
      label: "New",
      href: "/deliveries/new",
      icon: FiPlus,
    },
    {
      label: "Reports",
      href: "/reports",
      icon: FiBarChart2,
    },
  ];

  return (
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-4 z-50 sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-around rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-2 py-2 shadow-2xl">
          {menus.map((menu) => {
            const Icon =
              menu.icon;

            const active =
              pathname ===
              menu.href;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-2 transition-all ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon
                  size={20}
                />

                <span className="text-[11px] font-medium">
                  {menu.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
