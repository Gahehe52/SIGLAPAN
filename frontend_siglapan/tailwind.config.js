/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tani: {
          dark: '#40513B',
          light: '#628141',
          accent: '#EAB308', // Kuning profesional
          bg: '#F8FAF5'
        }
      }
    },
  },
  plugins: [],
}