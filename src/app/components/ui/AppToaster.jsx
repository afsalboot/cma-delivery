"use client";

import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: "#09090b",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "16px",
          color: "#f4f4f5",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        },
        success: {
          iconTheme: {
            primary: "#34d399",
            secondary: "#09090b",
          },
        },
        error: {
          iconTheme: {
            primary: "#fb7185",
            secondary: "#09090b",
          },
        },
      }}
    />
  );
}
