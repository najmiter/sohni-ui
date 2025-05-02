const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = mergeConfig(getDefaultConfig(__dirname), {
  /* your config */
});

module.exports = config;
