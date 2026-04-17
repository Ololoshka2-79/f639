/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--app-bg)',
          'surface-1': 'var(--app-surface-1)',
          'surface-2': 'var(--app-surface-2)',
          'surface-3': 'var(--app-surface-3)',
          'surface-hover': 'var(--app-surface-hover)',
          accent: 'var(--app-accent)',
          text: 'var(--app-text)',
          'text-muted': 'var(--app-text-muted)',
          border: 'var(--app-border)',
          'border-strong': 'var(--app-border-strong)',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'app-accent-gradient': 'linear-gradient(135deg, var(--app-surface) 0%, var(--app-bg) 100%)',
      },
      borderRadius: {
        'luxury': '24px',
      }
    },
  },
  plugins: [],
}
