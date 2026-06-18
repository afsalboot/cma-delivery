"use client";

import Navbar from "./Navbar";
import BottomBar from "./BottomBar";

export default function AppLayout({
  children,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
      <Navbar />

      <main className="px-4 pb-32 sm:pb-36">
        {children}
      </main>

      <BottomBar />
    </div>
  );
}
