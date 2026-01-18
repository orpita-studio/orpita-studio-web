/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files: [
      "./pages/**/*.{html,js}",
    ],
    transform: (content) => content.replace(/['"‘“`]/g, ' '),
  },
  theme: {
    extend: {},
  },
  plugins: [],
};