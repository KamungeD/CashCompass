# CashCompass - Production Deployment Guide

## 🚀 Phase 5.1: Production Environment Setup

This guide covers the production deployment setup for CashCompass, including backend API deployment and frontend hosting.

## 📋 Prerequisites

- Node.js 18+ LTS
- MongoDB Atlas account (or production MongoDB instance)
- Git repository access
- Domain name (optional)
- SSL certificate (for custom domain)

## 🖥️ Backend Deployment Options

### Option 1: Render.com (Recommended)

1. **Setup Repository**
   ```bash
   git add .
   git commit -m "Production setup complete"
   git push origin main
   ```

2. **Configure Render Service**
   - Connect GitHub repository
   - Use `render.yaml` configuration
   - Set environment variables:
     - `NODE_ENV=production`
     - `MONGO_URI=your-mongodb-atlas-connection-string`
     - `JWT_SECRET=your-secure-jwt-secret`
     - `FRONTEND_URL=https://your-frontend-domain.com`

3. **Database Setup**
   - Create MongoDB Atlas cluster
   - Configure IP whitelist (0.0.0.0/0 for Render)
   - Create database user with read/write permissions

### Option 2: Railway

1. **Deploy to Railway**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

2. **Configure Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set MONGO_URI=your-mongodb-connection
   railway variables set JWT_SECRET=your-jwt-secret
   ```

### Option 3: Docker Deployment

1. **Build Docker Image**
   ```bash
   cd backend
   docker build -t cashcompass-api .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Option 4: VPS/Server Deployment

1. **Setup PM2**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

2. **Configure Nginx (Optional)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🎨 Frontend Deployment Options

### Option 1: Vercel (Recommended)

1. **Deploy to Vercel**
   ```bash
   cd frontend
   npm install -g vercel
   vercel --prod
   ```

2. **Configure Environment Variables in Vercel Dashboard**
   - `VITE_API_URL=https://your-api-domain.com/api/v1`
   - `VITE_APP_NAME=CashCompass`
   - `VITE_APP_VERSION=1.0.0`

### Option 2: Netlify

1. **Deploy to Netlify**
   ```bash
   npm run build
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

2. **Configure via netlify.toml** (already configured)

### Option 3: Static Hosting

1. **Build for Production**
   ```bash
   npm run build:prod
   ```

2. **Upload to CDN/Static Host**
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps

## 🔧 Environment Configuration

### Backend Environment Variables

**Required:**
- `NODE_ENV=production`
- `PORT=5000`
- `MONGO_URI=mongodb+srv://...`
- `JWT_SECRET=your-secure-secret`

**Optional:**
- `JWT_EXPIRE=30d`
- `BCRYPT_ROUNDS=12`
- `FRONTEND_URL=https://your-frontend.com`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=100`

### Frontend Environment Variables

**Required:**
- `VITE_API_URL=https://your-api.com/api/v1`

**Optional:**
- `VITE_APP_NAME=CashCompass`
- `VITE_APP_VERSION=1.0.0`
- `VITE_ENABLE_ANALYTICS=true`
- `VITE_ENABLE_DARK_MODE=true`

## 🔐 Security Checklist

### Backend Security
- ✅ Environment variables secured
- ✅ CORS configured for production
- ✅ Rate limiting implemented
- ✅ Security headers configured
- ✅ Input validation and sanitization
- ✅ JWT secret secured
- ✅ Database connection secured

### Frontend Security
- ✅ Environment variables prefixed with VITE_
- ✅ API calls use HTTPS
- ✅ Content Security Policy configured
- ✅ XSS protection enabled
- ✅ No sensitive data in client code

## 📊 Monitoring & Logging

### Backend Monitoring
```bash
# Check application health
curl https://your-api.com/health

# Check API documentation
curl https://your-api.com/api/v1/docs

# PM2 monitoring (if using PM2)
pm2 monit
pm2 logs cashcompass-api
```

### Log Management
- Production logs stored in `logs/` directory
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- PM2 logs: PM2 dashboard or `pm2 logs`

## 🚦 Health Checks

### Backend Health Endpoint
```
GET /health
GET /api/v1/health
```

**Response:**
```json
{
  "success": true,
  "message": "CashCompass API is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## 🔄 Deployment Workflow

### Automated Deployment (Recommended)

1. **Push to main branch**
   ```bash
   git push origin main
   ```

2. **Automatic deployment triggers**
   - Render/Vercel: Auto-deploy on push
   - Railway: Auto-deploy on push
   - Manual: Use deployment scripts

### Manual Deployment

1. **Backend**
   ```bash
   cd backend
   npm run deploy:render  # or deploy:railway
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm run deploy:vercel  # or deploy:netlify
   ```

## 🧪 Production Testing

### Backend API Testing
```bash
# Test authentication
curl -X POST https://your-api.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test protected route
curl -X GET https://your-api.com/api/v1/transactions \
  -H "Authorization: Bearer your-jwt-token"
```

### Frontend Testing
1. Open production URL
2. Test authentication flow
3. Verify API connectivity
4. Test responsive design
5. Check dark mode functionality

## 🚨 Troubleshooting

### Common Issues

**CORS Errors:**
- Check `FRONTEND_URL` environment variable
- Verify allowed origins configuration

**Database Connection Issues:**
- Verify MongoDB URI
- Check IP whitelist settings
- Confirm database user permissions

**Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies installed
- Review build logs for specific errors

**Performance Issues:**
- Enable gzip compression
- Optimize image assets
- Implement caching strategies
- Use CDN for static assets

### Support Commands

```bash
# Check backend health
curl https://your-api.com/health

# View backend logs (PM2)
pm2 logs cashcompass-api

# Restart application (PM2)
pm2 restart cashcompass-api

# View system resources
pm2 monit
```

## 📈 Performance Optimization

### Backend Optimizations
- ✅ Database indexing implemented
- ✅ Query optimization
- ✅ Compression middleware enabled
- ✅ Caching strategies (Redis optional)
- ✅ Connection pooling configured

### Frontend Optimizations
- ✅ Code splitting implemented
- ✅ Asset optimization (images, fonts)
- ✅ Bundle size monitoring
- ✅ Lazy loading for routes
- ✅ CDN for static assets

## 🔮 Next Steps

1. **Custom Domain Setup**
   - Configure DNS records
   - SSL certificate installation
   - Domain verification

2. **Monitoring Enhancement**
   - Application performance monitoring
   - Error tracking (Sentry)
   - Analytics integration

3. **Backup Strategy**
   - Database backup automation
   - Application data export
   - Disaster recovery plan

---

**Author:** Duncan Kamunge (@KamungeD)  
**Project:** CashCompass Personal Finance Management  
**Phase:** 5.1 - Production Environment Setup
