/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      gridTemplateColumns: {
        '15/65/20': '15% 65% 20%',
      },
    },
  },
  plugins: [],
};
