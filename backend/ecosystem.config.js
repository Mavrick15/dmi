/**
 * Configuration PM2 pour la production
 * Usage: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'openclinic-backend',
      script: './build/server.js',
      instances: 'max', // Utiliser tous les CPU disponibles
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      // Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto-restart
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}

