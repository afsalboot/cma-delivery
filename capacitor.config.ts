import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cma.delivery",
  appName: "CMA Delivery",
  webDir: "public",
  server: {
    url: "https://cma-delivery.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#09090b",
  },
};

export default config;
