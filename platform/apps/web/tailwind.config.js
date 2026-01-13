/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // SLDS-inspired color palette
        brand: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b8dbff',
          300: '#7ac1ff',
          400: '#36a3ff',
          500: '#0176d3', // Salesforce blue
          600: '#0066b8',
          700: '#004d8c',
          800: '#003d6e',
          900: '#002d52',
        },
        success: {
          100: '#cdefc4',
          500: '#2e844a',
          700: '#194e31',
        },
        warning: {
          100: '#fef3cd',
          500: '#dd7a01',
          700: '#8e4b02',
        },
        error: {
          100: '#fdd4d4',
          500: '#c23934',
          700: '#8e1e1b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
