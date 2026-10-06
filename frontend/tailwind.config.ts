import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: { DEFAULT: "#0060a8", deep: "#004890" },
        night: "#001c24",
        foliage: "#122a1c",
        terracotta: { DEFAULT: "#c1480a", bright: "#f04800" },
        cream: "#f3ddc4",
        gold: "#e2a455",
        mist: "#d9d2c4",
        ok: "#8fd6a8",
        warn: "#ff6a4d",
      },
      fontFamily: {
        display: ["var(--font-italiana)", "serif"],
        body: ["var(--font-jost)", "sans-serif"],
      },
      backdropBlur: { xs: "2px" },
      borderRadius: { xl2: "20px" },
      boxShadow: {
        glass: "0 20px 40px -24px rgba(0,0,0,.5)",
        glow: "0 14px 28px -12px rgba(240,72,0,.55)",
      },
    },
  },
  plugins: [],
};
export default config;
