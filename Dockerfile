# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Add non-root user for security
RUN addgroup -g 1001 nestapp && \
    adduser -S -u 1001 -G nestapp nestapp


# Only copy what's necessary
COPY --from=builder --chown=nestapp:nestapp /app/dist ./dist
COPY --from=builder --chown=nestapp:nestapp /app/node_modules ./node_modules
COPY --from=builder --chown=nestapp:nestapp /app/package*.json ./

USER nestapp

EXPOSE 5002 5052
CMD ["node", "dist/main"]
