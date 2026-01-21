# Automation Service Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Default command runs the daily scheduler
# Can be overridden in docker-compose or k8s
CMD ["node", "dist/scripts/daily-scheduler.js"]
