module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'react-native-css-interop/babel'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: 'react-native-dotenv',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true
      }]
    ]
  };
};