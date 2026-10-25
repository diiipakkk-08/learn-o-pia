/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        sidebar: 'var(--bg-sidebar)',
        surface: 'var(--bg-surface)',
        'surface-hover': 'var(--bg-surface-hover)',
        'surface-sunken': 'var(--bg-surface-sunken)',
        subtle: 'var(--bg-subtle)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-on-dark': 'var(--text-on-dark)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'accent-ink': 'var(--accent-ink)',
        'accent-forest': 'var(--accent-forest)',
        'accent-forest-bg': 'var(--accent-forest-bg)',
        'accent-amber': 'var(--accent-amber)',
        'accent-amber-bg': 'var(--accent-amber-bg)',
        'accent-danger': 'var(--accent-danger)',
        'accent-danger-bg': 'var(--accent-danger-bg)',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Newsreader', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        modal: 'var(--shadow-modal)',
      }
    },
  },
  plugins: [],
}
