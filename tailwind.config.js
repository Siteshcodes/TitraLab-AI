/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Phenolphthalein endpoint pink (used by the simulation color ramp too)
        pheno: {
          DEFAULT: '#e0218a',
          deep: '#c81677',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        bench: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.08)',
      },
    },
  },
  plugins: [],
}
