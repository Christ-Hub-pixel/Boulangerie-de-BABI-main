# Production Dockerfile for Boulangerie de BABI
FROM node:20-alpine

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]
