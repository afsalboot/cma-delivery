import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {
  DashboardProvider,
} from "@/context/DashboardContext";

import {
  DeliveryProvider,
} from "@/context/DeliveryContext";

import AppLayout from "./components/layout/AppLayout";
import AppToaster from "./components/ui/AppToaster";
import { PaymentProvider } from "../context/PaymentContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CMA Delivery",
  description:
    "Delivery tracking and revenue management dashboard",
  applicationName: "CMA Delivery",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CMA Delivery",
  },
  icons: {
    icon: {
      url: "/favicon-32x32.png",
      type: "image/png",
      sizes: "32x32",
    },
    shortcut: "/favicon-32x32.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen overflow-x-hidden bg-black text-white">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-white/[0.03] blur-3xl" />
        </div>

        <DashboardProvider>
          <DeliveryProvider>
            <PaymentProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <AppToaster />
            </PaymentProvider>
          </DeliveryProvider>
        </DashboardProvider>
      </body>
    </html>
  );
}
