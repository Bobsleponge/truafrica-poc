import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(215 20% 24%)',
        input: 'hsl(215 20% 18%)',
        ring: 'hsl(190 100% 65%)',
        background: 'hsl(222 47% 5%)',
        foreground: 'hsl(210 40% 98%)',
        primary: {
          DEFAULT: 'hsl(190 100% 60%)',
          foreground: 'hsl(222 47% 5%)',
        },
        secondary: {
          DEFAULT: 'hsl(222 47% 11%)',
          foreground: 'hsl(210 40% 96%)',
        },
        accent: {
          DEFAULT: 'hsl(190 100% 20%)',
          foreground: 'hsl(190 100% 75%)',
        },
        muted: {
          DEFAULT: 'hsl(222 47% 11%)',
          foreground: 'hsl(215 20% 70%)',
        },
        card: {
          DEFAULT: 'hsl(222 47% 7%)',
          foreground: 'hsl(210 40% 98%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 84% 60%)',
          foreground: 'hsl(210 40% 98%)',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        'neon-blue':
          '0 0 20px rgba(56, 189, 248, 0.4), 0 0 40px rgba(56, 189, 248, 0.3)',
      },
    },
  },
  plugins: [],
}

export default config




