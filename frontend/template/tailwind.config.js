/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Fix for known font smoothing issues in some browsers
  corePlugins: {
    fontSmoothing: true,
  },
};
