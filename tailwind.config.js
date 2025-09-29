/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/theme");

module.exports = {
  darkMode: "class",
  // v4 ignores content by default; safe to omit.
  theme: {
    extend: {},
  },
  plugins: [heroui()],
};
