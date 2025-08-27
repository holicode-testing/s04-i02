# Stage 1: Dependency Installation & Caching
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Install pnpm globally to ensure it's available for subsequent pnpm commands
RUN npm install -g pnpm
# Fetch and install all dependencies for the monorepo root
RUN pnpm install --frozen-lockfile

# Stage 2: Builder (builds the entire monorepo into a self-contained image)
FROM node:20-alpine AS builder
WORKDIR /app
# Copy the entire monorepo source code
COPY . .
# Copy node_modules from the deps stage to ensure all dependencies are available
COPY --from=deps /app/node_modules ./node_modules
# Copy pnpm-workspace.yaml as it's needed for Nx commands
COPY pnpm-workspace.yaml .

# Build the 'web' application using Nx
RUN pnpm nx build web

# Stage 3: Development Runner (for hot-reloading with mounted volumes)
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only the built applications and node_modules from the builder stage
# The source code will be mounted over this for hot-reloading
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist # Copy built artifacts if needed for runtime

# The entire source will be mounted as a volume, so no need to copy individual source files
# However, root-level config files not subject to hot-reloading should be in the image.
# These files are *not* mounted as volumes, so they must be in the image.
COPY package.json nx.json tsconfig.base.json tsconfig.json pnpm-lock.yaml ./

EXPOSE 5173

# Command to run the application (Nx serve will re-transpile on changes)
CMD ["pnpm", "nx", "serve", "web"]
