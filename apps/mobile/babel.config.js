module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle migrations are bundled as text (ADR 0004).
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
