/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './node_modules/flowbite/**/*.js',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '16/64/20': '16% 64% 20%',
      },
    },
  },
  plugins: [require('flowbite/plugin')],
};
