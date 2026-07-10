/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#141414',
        paper: '#ffffff',
        bone: '#f4f1ea',
        sand: '#e5e5e0',
        iris: '#7D61F2',
        'iris-tint': '#EFECFE',
        acid: '#DBFF4D',
        danger: '#E2435A',
        success: '#16A34A',
        line: 'rgba(20,20,20,0.1)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        motionFadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'motion-fadein': 'motionFadeIn 320ms cubic-bezier(0.2,0.8,0.2,1) both',
      },
    },
  },
  plugins: [],
}
