
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'card-dark': 'rgba(17, 25, 40, 0.75)',
        'panel-dark': 'rgba(17, 25, 40, 0.65)'
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(0,0,0,0.25)'
      },
      borderRadius: {
        'xl2': '1.25rem'
      }
    },
  },
  plugins: [],
};
