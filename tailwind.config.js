/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Open Sans"', 'sans-serif'],
      },
      colors: {
        board: "#ebecfo",
        surface: "#ffffff",
        primary: "#008bd2",
        primaryHover: "#0072b0",
        success: "#008bd2",
        warning: "#ffda65",
        danger: "#ff0000",
        textMain: "#043962",
        textMuted: "#5a7a96",
        project: {
          blue: "#ebf3f9",
          green: "#e0f2ec",
          purple: "#edeaf5",
          orange: "#fcf3e8",
          pink: "#f5e8ed",
          yellow: "#fdf8e6",
          gray: "#ebecfo"
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 2px 10px -1px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
