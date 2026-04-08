/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0284c7', // Sky 600
          hover: '#0369a1',   // Sky 700
          light: '#e0f2fe',   // Sky 100
        },
        success: { DEFAULT: '#10b981', light: '#d1fae5' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7' },
        danger: { DEFAULT: '#ef4444', light: '#fee2e2' },
        background: '#ffffff',
        surface: '#f8fafc',
        border: '#e2e8f0',
        text: {
          main: '#0f172a',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('tailwindcss-animate'),
  ],
}