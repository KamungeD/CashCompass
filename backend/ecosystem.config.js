module.exports = {
  apps: [
    {
      name: 'cashcompass-api',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000
      },
      // PM2 configuration
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      
      // Health check
      health_check_url: 'http://localhost:5000/health',
      health_check_grace_period: 3000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Environment specific settings
      node_args: '--max_old_space_size=1024'
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:KamungeD/cashcompass.git',
      path: '/var/www/cashcompass-api',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
