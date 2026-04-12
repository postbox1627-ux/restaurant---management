/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

theme: {
  extend: {
    keyframes: {
      shrink: {
        '0%': { width: '100%' },
        '100%': { width: '0%' },
      }
    },
    animation: {
      // already there if you have tailwindcss-animate for slide-in
    }
  }
}
