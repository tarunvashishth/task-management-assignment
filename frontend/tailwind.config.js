/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ping-slow': {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1'   },
          '50%':      { transform: 'scale(1.6)', opacity: '0.4' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0'  },
        },
        'toast-in': {
          '0%':   { opacity: '0', transform: 'translateX(120%) scale(0.95)' },
          '60%':  { opacity: '1', transform: 'translateX(-4%) scale(1.01)'  },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)'       },
        },
        'toast-out': {
          '0%':   { opacity: '1', transform: 'translateX(0) scale(1)'         },
          '100%': { opacity: '0', transform: 'translateX(120%) scale(0.95)'   },
        },
        'toast-progress': {
          '0%':   { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':   'scale-in 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down': 'slide-down 0.2s ease-out both',
        'ping-slow':  'ping-slow 2s ease-in-out infinite',
        shimmer:      'shimmer 1.4s linear infinite',
        'toast-in':   'toast-in 0.45s cubic-bezier(0.22,1.2,0.36,1) both',
        'toast-out':  'toast-out 0.35s cubic-bezier(0.4,0,1,1) forwards',
      },
    },
  },
  plugins: [],
};
