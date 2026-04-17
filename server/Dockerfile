FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install with increased timeout and retry logic
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 120000

# Install dependencies
RUN npm ci --omit=dev || npm install

# Copy application code
COPY . .

# Set default environment variables
ENV PORT=3000
ENV NODE_ENV=development

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
