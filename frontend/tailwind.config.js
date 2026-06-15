/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {
        cosmic: {
          50: '#f0efff',
          100: '#e0ddff',
          200: '#c4bdff',
          300: '#a092ff',
          400: '#7a63ff',
          500: '#5b3bff',
          600: '#4820f5',
          700: '#3a14db',
          800: '#2e10af',
          900: '#1a1446',
          950: '#0d0826',
        },
        aurora: {
          DEFAULT: '#4cc9f0',
          light: '#7df0ff',
          dark: '#1e94c4',
        },
        starlight: {
          DEFAULT: '#ffd166',
          light: '#ffe6a8',
          dark: '#f5a623',
        },
        nebula: {
          pink: '#f72585',
          purple: '#7209b7',
          mint: '#06d6a0',
          orange: '#ff7b00',
        },
        paper: {
          DEFAULT: '#fdf8f0',
          light: '#fffef9',
          dark: '#f0e6d3',
          warm: '#f5ecd9',
        }
      },
      fontFamily: {
        'serif-sc': ['"Noto Serif SC"', 'Georgia', 'serif'],
        'sans-sc': ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'starry-sky': 'radial-gradient(ellipse at top, #1a1446 0%, #0d0826 50%, #05020f 100%)',
        'nebula-glow': 'radial-gradient(circle at 20% 30%, rgba(114, 9, 183, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(76, 201, 240, 0.2) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(247, 37, 133, 0.15) 0%, transparent 60%)',
        'paper-texture': 'linear-gradient(135deg, #fdf8f0 0%, #f5ecd9 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(255, 209, 102, 0.3)',
        'glow': '0 0 24px rgba(76, 201, 240, 0.4)',
        'glow-lg': '0 0 48px rgba(122, 99, 255, 0.5)',
        'paper': '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'paper-lg': '0 8px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'shooting-star': 'shooting-star 4s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'typewriter': 'typewriter 3s steps(40) forwards',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'shooting-star': {
          '0%': { transform: 'translateX(0) translateY(0)', opacity: '1' },
          '100%': { transform: 'translateX(500px) translateY(500px)', opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(255, 209, 102, 0.3)' },
          '50%': { boxShadow: '0 0 28px rgba(255, 209, 102, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
