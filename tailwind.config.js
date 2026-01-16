/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}" // Just in case, though structure seems root-based
    ],
    theme: {
        extend: {
            colors: {
                background: '#FAFAFA', // Clean off-white
                surface: '#FFFFFF',
                ink: {
                    DEFAULT: '#18181B', // Zinc 900
                    light: '#71717A',   // Zinc 500
                    lighter: '#E4E4E7'  // Zinc 200
                },
                brand: {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    500: '#F97316', // Orange 500
                    600: '#EA580C',
                    900: '#7C2D12',
                },
                accent: {
                    green: '#10B981', // Emerald
                    yellow: '#FBBF24', // Amber
                    red: '#EF4444',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.02)',
                'premium-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.02)',
                'float': '0 10px 30px -10px rgba(249, 115, 22, 0.3)', // Orange glow
            },
            backgroundImage: {
                'gradient-premium': 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)',
                'gradient-brand': 'linear-gradient(135deg, #F97316 0%, #F59E0B 100%)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        }
    },
    plugins: [],
}
