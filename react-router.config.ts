import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src/app",
  ssr: true,
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
