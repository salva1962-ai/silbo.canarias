/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        primary: '#5C7CFA',
        secondary: '#66D9E8',
        warning: '#FFE066',
        success: '#8CE99A',
        danger: '#FFA8A8',
        'pastel-indigo': '#5C7CFA',
        'pastel-cyan': '#66D9E8',
        'pastel-yellow': '#FFD43B',
        'pastel-green': '#8CE99A',
        'pastel-red': '#FFA8A8'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.08)',
        'pastel-indigo': '0 4px 14px 0 rgba(92, 124, 250, 0.15)',
        'pastel-cyan': '0 4px 14px 0 rgba(102, 217, 232, 0.15)',
        'pastel-yellow': '0 4px 14px 0 rgba(255, 212, 59, 0.15)',
        'pastel-green': '0 4px 14px 0 rgba(140, 233, 154, 0.15)',
        'pastel-red': '0 4px 14px 0 rgba(255, 168, 168, 0.15)'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      }
    }
  },
  plugins: []
}
