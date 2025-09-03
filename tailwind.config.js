/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Auction-themed palette
        earth: {
          light: '#d9cbb6',
          DEFAULT: '#b89b74',
          dark: '#8a6f4b',
        },
        vintage: {
          black: '#1f1d1a',
          brown: '#4b3b2b',
          cream: '#f7f3ee',
        },
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "Times", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
}
