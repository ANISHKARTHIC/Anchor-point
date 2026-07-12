/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#334155", /* slate-700 */
        secondary: "#475569", /* slate-600 */
        tertiary: "#94A3B8", /* slate-400 */
        appBg: "#F8FAFC", /* slate-50 */
        accent: "#059669", /* emerald-600 */
        skin: "#059669",
        boldGrey: "#0F172A", /* slate-900 */
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
      }
    },
  },
  plugins: [],
};
