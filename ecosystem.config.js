module.exports = {
  apps: [
    {
      name: 'app',
      script: 'src/index.js',
      env: {
        watch: true,
        PORT: 3000,
        NODE_PATH: 'src',
        NODE_ENV: 'development',
        LOG_LEVEL: 'trace',
        DISABLE_CSRF: true
      },
      env_production: {
        watch: false,
        PORT: 3000,
        NODE_PATH: 'src',
        NODE_ENV: 'production',
        LOG_LEVEL: 'debug',
        DISABLE_CSRF: true,
        kill_timeout: 3000,
        'restart-delay': 3000
      }
    }
  ]
}
