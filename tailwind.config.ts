
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					dark: 'hsl(var(--primary-dark))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					light: 'hsl(var(--accent-light))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'slide-up-fade': {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-down-fade': {
                    '0%': { opacity: '0', transform: 'translateY(-8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-spring': {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '70%': { transform: 'scale(1.02)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                'breathe': {
                    '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.3)' },
                    '50%': { boxShadow: '0 0 0 8px hsl(var(--primary) / 0)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)', transform: 'scale(1)' },
                    '50%': { boxShadow: '0 0 12px 4px hsl(var(--primary) / 0.25)', transform: 'scale(1.03)' },
                },
                'count-up': {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.5s ease-out',
                'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-in': 'slide-in 0.5s ease-out',
                'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-up-fade': 'slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-down-fade': 'slide-down-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'scale-spring': 'scale-spring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'breathe': 'breathe 2.5s ease-in-out infinite',
                'count-up': 'count-up 0.4s ease-out',
                'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
			},
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-primary': 'var(--gradient-primary)',
                'gradient-secondary': 'var(--gradient-secondary)',
                'gradient-hero': 'var(--gradient-hero)',
                'gradient-subtle': 'var(--gradient-subtle)',
                'gradient-glass': 'var(--gradient-glass)',
                'gradient-mesh': 'var(--gradient-mesh)',
            },
            boxShadow: {
                'subtle': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
                'glass': 'var(--shadow-glass)',
                'glass-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'glass-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                'elegant': 'var(--shadow-elegant)',
                'glow': 'var(--shadow-glow)',
                'soft': 'var(--shadow-soft)',
                'card': 'var(--shadow-card)',
                'card-hover': 'var(--shadow-card-hover)',
                'float': 'var(--shadow-float)',
            },
            fontFamily: {
                'display': ['Playfair Display', 'serif'],
                'sans': ['Inter', 'system-ui', 'sans-serif'],
            },
            transitionDuration: {
                '400': '400ms',
                '600': '600ms',
            },
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
