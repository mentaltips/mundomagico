module.exports = {
  plugins: {
    [require.resolve('tailwindcss')]: { config: require.resolve('./tailwind.config.js') },
    [require.resolve('autoprefixer')]: {},
  },
}
