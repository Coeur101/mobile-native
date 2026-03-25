import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aiwebbuilder.mobile",
  appName: "AI Web Builder",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
