# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cashcompass -u 1001

# Copy source code
COPY --chown=cashcompass:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R cashcompass:nodejs logs

# Switch to non-root user
USER cashcompass

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node utils/healthcheck.js

# Start application
CMD ["npm", "start"]
