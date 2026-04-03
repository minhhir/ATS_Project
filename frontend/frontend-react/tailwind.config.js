/** @type {import('tailwindcss').Config} */
export default {

  darkMode: 'class',

  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: '#dbeafe',
          dark: '#1e40af',
        },


        auth: {
          DEFAULT: '#ec5b13',
          hover: '#d44e0f',
          light: '#fff7ed',
          dark: '#9a3412',
        },

        success: { DEFAULT: '#10b981', light: '#d1fae5', dark: '#065f46' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#92400e' },
        danger: { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#991b1b' },
        info: { DEFAULT: '#3b82f6', light: '#dbeafe', dark: '#1e40af' },

        score: {
          high: '#10b981',  // 90-100%
          mid: '#2563eb',  // 70-89%
          low: '#f59e0b',  // 50-69%
        },

        'bg-light': '#f6f6f8',
        'bg-dark': '#111621',

        // Auth backgrounds
        'bg-auth-dark': '#221610',
      },

      fontFamily: {
        // App chính (tất cả pages trừ auth-secondary)
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        // Auth phụ (Forgot/OTP/Reset)
        auth: ['"Public Sans"', 'Inter', 'sans-serif'],
        // Mono cho code/numbers
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },

      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },


      boxShadow: {
        'primary-sm': '0 2px 8px rgba(37,99,235,.2)',
        'primary-md': '0 4px 16px rgba(37,99,235,.25)',
        'card': '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
      },


      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        growUp: { 'from': { height: '0' } },
        spin: {
          'to': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp .5s ease both',
        'fade-up-1': 'fadeUp .5s .1s ease both',
        'fade-up-2': 'fadeUp .5s .2s ease both',
        'fade-up-3': 'fadeUp .5s .3s ease both',
        'fade-in': 'fadeIn .6s .3s ease both',
        'grow-up': 'growUp .8s ease-out forwards',
      },
    },
  },

  plugins: [],
}