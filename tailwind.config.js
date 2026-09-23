/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Structural colours are driven by CSS variables, declared once in index.css.
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        // Accent system — semantic meaning, not decoration.
        blue: 'rgb(var(--c-blue) / <alpha-value>)',
        lime: 'rgb(var(--c-lime) / <alpha-value>)',
        yellow: 'rgb(var(--c-yellow) / <alpha-value>)',
        coral: 'rgb(var(--c-coral) / <alpha-value>)',
        purple: 'rgb(var(--c-purple) / <alpha-value>)',
      },
      borderWidth: {
        3: '3px',
        4: '4px',
        5: '5px',
      },
      borderRadius: {
        brutal: '6px',
      },
      boxShadow: {
        'brutal-xs': '2px 2px 0 0 rgb(var(--c-ink))',
        'brutal-sm': '3px 3px 0 0 rgb(var(--c-ink))',
        brutal: '5px 5px 0 0 rgb(var(--c-ink))',
        'brutal-md': '6px 6px 0 0 rgb(var(--c-ink))',
        'brutal-lg': '9px 9px 0 0 rgb(var(--c-ink))',
        'brutal-xl': '14px 14px 0 0 rgb(var(--c-ink))',
        none: '0 0 0 0 rgb(var(--c-ink))',
      },
      fontFamily: {
        sans: [
          '"Space Grotesk Variable"',
          'Space Grotesk',
          'Inter Tight',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
        mega: '0.22em',
      },
      fontSize: {
        micro: ['0.625rem', { lineHeight: '0.9', letterSpacing: '0.16em' }],
        '10xl': ['9rem', { lineHeight: '0.82' }],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        rise: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.92) rotate(-1.5deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.15' },
        },
        ping_soft: {
          '0%': { transform: 'scale(1)', opacity: '0.9' },
          '70%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        sweep: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        rise: 'rise 0.34s cubic-bezier(0.2, 0.9, 0.2, 1) both',
        pop: 'pop 0.28s cubic-bezier(0.2, 0.9, 0.2, 1) both',
        blink: 'blink 1.6s steps(2, start) infinite',
        ping_soft: 'ping_soft 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        sweep: 'sweep 5.5s linear infinite',
      },
    },
  },
  plugins: [],
};
