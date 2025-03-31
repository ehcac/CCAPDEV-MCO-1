/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    content: ['./index.html', 
              './src/*.{js,ts,jsx,tsx}',
              './src/assets/*.{js,ts,jsx,tsx}',
              './src/components/*.{js,ts,jsx,tsx}',
              './src/pages/*.{js,ts,jsx,tsx}',
              './src/pages/content/*.{js,ts,jsx,tsx}',],
    theme: {
        screens: {
            sm: '480px',
            md: '768px',
            lg: '976px',
            xl: '1440px',
        },
        colors: {
            fontgray: '#4a4747',
            fieldgray: '#f4f4f4',
            outlinepink: '#e5bec8',
            outlinepurple: '#d3bed9',
            outlineblue: '#b0d7ec',
            bgpink: '#ecd5db',
            bgpurple: '#dad5ec',
            bgblue: '#d5e2ec',
            linkblue: '#5f92cc',
            errorred: '#cc5f5f',
            white: '#ffffff',
        },
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
        },
    },
    plugins: [
        require('tailwind-scrollbar'),
    ],
};