const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.resolver.sourceExts = [...resolver.sourceExts, "cjs", "ts", "tsx"];

module.exports = config;
