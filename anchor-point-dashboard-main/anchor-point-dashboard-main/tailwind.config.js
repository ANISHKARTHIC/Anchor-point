/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#21539E",
        secondary: "#4EC7E6",
        tertiary: "#64748B",
        appBg: "#F8FAFC",
        skin: "#f2c04c",
        boldGrey: "#94A3B8",
      },
    },
  },
  plugins: [],
};
