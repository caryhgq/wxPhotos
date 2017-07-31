module.exports = {
  apps: [{
    name: 'wxPhotos',
    script: 'index.js',
    watch: true,
    env: {
      COMMON_VARIABLE: 'true'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    log_date_format:'YYYY-MM-DD HH:mm',
    log_file: "./logs/combined.outerr.log",
    error_file:'./logs/err.log',
    out_file:'./logs/out.log',
    combine_logs:true
  }]
};
