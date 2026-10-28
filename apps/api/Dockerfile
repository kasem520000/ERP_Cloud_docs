FROM node:22-alpine AS base
WORKDIR /app
RUN npm i -g pnpm@9.15.9
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/domain-core/package.json ./packages/domain-core/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm --filter @erp/domain-core build && pnpm --filter @erp/contracts build && pnpm --filter @erp/api build
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
