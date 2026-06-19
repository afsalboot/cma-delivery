"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  FiHome,
  FiPackage,
  FiPlus,
  FiBarChart2,
  FiUsers,
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
      featured: true,
    },
    {
      label: "Customers",
      href: "/customers",
      icon: FiUsers,
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
                menu.href ||
              (menu.href !== "/" && pathname?.startsWith(`${menu.href}/`));

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl transition-all ${
                  menu.featured
                    ? `-mt-7 size-16 border border-emerald-300/40 bg-emerald-400 text-zinc-950 shadow-xl shadow-emerald-500/25 ${
                        active ? "scale-105" : "hover:scale-105"
                      }`
                    : `px-2.5 py-2 sm:px-4 ${
                        active
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                      }`
                }`}
              >
                <Icon
                  size={menu.featured ? 24 : 20}
                />

                <span className={`font-medium ${menu.featured ? "text-[10px]" : "text-[11px]"}`}>
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
