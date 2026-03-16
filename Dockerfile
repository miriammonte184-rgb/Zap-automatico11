FROM node:20-alpine

WORKDIR /app

# Enable corepack so pnpm is available
RUN corepack enable

# Copy the whole workspace (includes Zap-Connect monorepo)
COPY . .

# Install dependencies from the Zap-Connect workspace root
WORKDIR /app/Zap-Connect
RUN pnpm install --frozen-lockfile

# Run the API server in production mode
WORKDIR /app/Zap-Connect/artifacts/api-server

ENV NODE_ENV=production

# Railway fornece a variável PORT automaticamente.
# Expomos uma porta padrão para desenvolvimento local.
ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "exec", "tsx", "./src/index.ts"]

