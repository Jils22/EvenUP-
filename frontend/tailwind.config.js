/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#091428",
        sidebar: "#081223",
        card: "#101C36",
        primary: "#C08FF5",
        success: "#42E3D0",
        warning: "#E7BE29",
        danger: "#F86161",
        secondary: "#A8B3C7",
        muted: "#6F7D97",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
