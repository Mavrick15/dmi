/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
        },
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          foreground: "var(--color-success-foreground)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          foreground: "var(--color-warning-foreground)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-error-foreground)",
        },
        // Vos couleurs médicales personnalisées (Conservées)
        "medical-blue": "#2563EB",
        "medical-navy": "#1E40AF",
        "medical-green": "#10B981",
        "medical-indigo": "#6366F1",
        "clinical-white": "#F8FAFC",
        "professional-charcoal": "#1F2937",
        "medical-gray": "#6B7280",
        "medical-red": "#DC2626",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      fontSize: {
        'medical-xs': ['0.75rem', { lineHeight: '1.5' }],
        'medical-sm': ['0.875rem', { lineHeight: '1.6' }],
        'medical-base': ['1rem', { lineHeight: '1.6' }],
        'medical-lg': ['1.125rem', { lineHeight: '1.5' }],
        'medical-xl': ['1.25rem', { lineHeight: '1.4' }],
        'medical-2xl': ['1.5rem', { lineHeight: '1.3' }],
        'medical-3xl': ['1.875rem', { lineHeight: '1.2' }],
        'medical-4xl': ['2.25rem', { lineHeight: '1.2' }],
        'medical-5xl': ['3rem', { lineHeight: '1.1' }],
      },
      spacing: {
        'clinical-xs': '0.25rem',
        'clinical-sm': '0.5rem',
        'clinical-md': '1rem',
        'clinical-lg': '1.5rem',
        'clinical-xl': '2rem',
        'clinical-2xl': '3rem',
        'clinical-3xl': '4rem',
      },
      boxShadow: {
        'medical-sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'medical-md': '0 4px 12px rgba(59, 130, 246, 0.08)',
        'medical-lg': '0 10px 40px rgba(59, 130, 246, 0.1)',
        'medical-glow': '0 8px 25px rgba(59, 130, 246, 0.15)',
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scaleIn 0.2s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin 3s linear infinite", // Ajouté car utilisé dans InventoryTable
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      backdropBlur: {
        'medical': '8px',
      },
      zIndex: {
        'medical-header': '50',
        'medical-sidebar': '40',
        'medical-modal': '60',
        'medical-tooltip': '70',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"), // Ajouté
    require("tailwindcss-fluid-type"), // Ajouté
  ],
}