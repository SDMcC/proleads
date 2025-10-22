/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4a6cf7',
        dark: '#1d2430',
        'gray-dark': '#1e232e',
        'body-color': '#788293',
        'body-color-dark': '#959cb1',
        'stroke': '#e3e8ef',
        'stroke-dark': '#353943',
        'bg-color-dark': '#171c28',
      },
      boxShadow: {
        'sticky': 'inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)',
        'sticky-dark': 'inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};