/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        panel: 'var(--panel-shadow)',
        xs: '0 1px 3px #0f172a0d',
        '2xs': '0 1px 2px #0f172a08',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        dmsans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        traffic: {
          green: {
            DEFAULT: '#10b981',
            light: '#ecfdf5',
            border: '#a7f3d0',
            dark: '#065f46',
          },
          yellow: {
            DEFAULT: '#f59e0b',
            light: '#fffbeb',
            border: '#fde68a',
            dark: '#92400e',
          },
          red: {
            DEFAULT: '#ef4444',
            light: '#fef2f2',
            border: '#fecaca',
            dark: '#991b1b',
          },
        },
        brand: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6df',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
    },
  },
  plugins: [],
};
