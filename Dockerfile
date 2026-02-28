# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Use 'npm ci' for exact version matching from lockfile
RUN npm ci

# Stage 2: Build the app
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

# Best Practice: Run as non-root user for security
RUN addgroup -S sveltegroup && adduser -S svelteuser -G sveltegroup
USER svelteuser

# Copy only the necessary build artifacts
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Coolify defaults to port 3000
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start the SvelteKit server
CMD ["node", "build"]