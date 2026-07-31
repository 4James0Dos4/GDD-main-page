# Astro (static + Node adapter) — produkcja dla Coolify / docker compose
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Nie ustawiaj VERCEL=1 — używamy adaptera Node (standalone).
ARG WP_API_URL=http://wordpress/wp-json
ARG PUBLIC_WP_SITE_URL=http://localhost:8081
ARG PUBLIC_SITE_URL=http://localhost:4321
ENV WP_API_URL=$WP_API_URL \
    PUBLIC_WP_SITE_URL=$PUBLIC_WP_SITE_URL \
    PUBLIC_SITE_URL=$PUBLIC_SITE_URL

RUN pnpm run build \
  && pnpm prune --prod

FROM base AS runner
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

RUN mkdir -p /app/.data /app/private/audiobooks

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
