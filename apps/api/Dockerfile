# API image (ADR 0011). Build context: the repository root.
#   docker build -f apps/api/Dockerfile -t kawsay-api .

FROM node:24-alpine AS build
WORKDIR /repo
ENV HUSKY=0
RUN npm install -g pnpm@12.6.0
# Only what the API needs from the workspace: the app is not part of the image.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/config packages/config
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm install --frozen-lockfile --filter "@kawsay/api..."
RUN pnpm --filter @kawsay/contracts build \
  && pnpm --filter @kawsay/api generate \
  && pnpm --filter @kawsay/api build
RUN pnpm --filter @kawsay/api deploy --prod --legacy /out \
  && cp -r apps/api/dist apps/api/prisma apps/api/prisma.config.ts /out/

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /out /app
USER node
EXPOSE 3000
# Applies pending migrations, then serves. Prisma's CLI is a runtime dependency for this step only.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && exec node dist/main.js"]
