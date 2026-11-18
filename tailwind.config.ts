import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        wood: 'rgb(var(--c-wood) / <alpha-value>)',
        'wood-dark': 'rgb(var(--c-wood-dark) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        'ink-sec': 'rgb(var(--c-ink-sec) / <alpha-value>)',
        'ink-muted': 'rgb(var(--c-ink-muted) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--c-accent-ink) / <alpha-value>)',
        bp: 'rgb(var(--c-bp) / <alpha-value>)',
        'bp-panel': 'rgb(var(--c-bp-panel) / <alpha-value>)',
        'bp-ink': 'rgb(var(--c-bp-ink) / <alpha-value>)',
        'bp-sec': 'rgb(var(--c-bp-sec) / <alpha-value>)',
        stamp: 'rgb(var(--c-stamp) / <alpha-value>)',
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        'paper-sub': 'rgb(var(--c-paper-sub) / <alpha-value>)',
        cork: 'rgb(var(--c-cork) / <alpha-value>)',
        brass: 'rgb(var(--c-brass) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

export default config;
