const DEVELOPMENT_VARIANT = 'development';

module.exports = ({ config }) => {
  const isDevelopment = process.env.APP_VARIANT === DEVELOPMENT_VARIANT;

  return {
    ...config,
    name: isDevelopment ? 'Save Your Money Dev' : config.name,
    scheme: isDevelopment ? 'saveyourmoney-dev' : config.scheme,
    android: {
      ...config.android,
      package: isDevelopment ? 'com.kianfratz.saveyourmoney.dev' : config.android?.package,
    },
  };
};
