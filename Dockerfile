ARG NODE_OPTIONS="--max-old-space-size=8192"
ARG NEXT_PUBLIC_APP_VERSION="dev"

# --- Base Image ---
FROM node:lts-bullseye-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# --- Dependencies + Prisma client (shared by web & admin builds) ---
FROM base AS build-prep
ARG NODE_OPTIONS
ARG NEXT_PUBLIC_APP_VERSION

COPY package.json pnpm-lock.yaml ./
COPY ./prisma /app/prisma
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_OPTIONS=$NODE_OPTIONS
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

ARG DATABASE_URL=mysql://localhost:3306/dummy
RUN DATABASE_URL=${DATABASE_URL} pnpm run prisma:generate

# --- Public website image (no /admin UI, no admin API) ---
FROM build-prep AS build-web
RUN rm -rf app/admin && rm -f app/page.tsx && \
    cp docker/build/app-entry-web.ts server/app.ts && \
    cp docker/build/proxy-web.ts proxy.ts
RUN pnpm run build

# --- Admin-only image (no public site routes; / → /admin) ---
FROM build-prep AS build-admin
RUN rm -rf "app/(public-website)" && \
    cp docker/build/admin-root-page.tsx app/page.tsx && \
    cp docker/build/app-entry-admin.ts server/app.ts && \
    cp docker/build/proxy-admin.ts proxy.ts
RUN pnpm run build

# --- Release: public website (default `docker build` target) ---
FROM base AS release-web

RUN apt update && apt install -y dumb-init --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node --from=build-web /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY --chown=node:node --from=build-web /app/.next ./.next
COPY --chown=node:node --from=build-web /app/public ./public
COPY --chown=node:node --from=build-web /app/prisma ./prisma
COPY --chown=node:node --from=build-web /app/prisma.config.ts ./prisma.config.ts
COPY --from=build-web /app/generated/prisma ./generated/prisma

COPY --chown=node:node --from=build-web /app/tsconfig.json ./tsconfig.json
COPY --chown=node:node --from=build-web /app/workers ./workers
COPY --chown=node:node --from=build-web /app/server ./server
COPY --chown=node:node --from=build-web /app/lib ./lib

ENV TZ=UTC
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

USER node

CMD [ "dumb-init", "pnpm", "run", "start" ]

# --- Release: admin panel only (build with: docker build --target release-admin) ---
FROM base AS release-admin

RUN apt update && apt install -y dumb-init --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node --from=build-admin /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY --chown=node:node --from=build-admin /app/.next ./.next
COPY --chown=node:node --from=build-admin /app/public ./public
COPY --chown=node:node --from=build-admin /app/prisma ./prisma
COPY --chown=node:node --from=build-admin /app/prisma.config.ts ./prisma.config.ts
COPY --from=build-admin /app/generated/prisma ./generated/prisma

COPY --chown=node:node --from=build-admin /app/tsconfig.json ./tsconfig.json
COPY --chown=node:node --from=build-admin /app/workers ./workers
COPY --chown=node:node --from=build-admin /app/server ./server
COPY --chown=node:node --from=build-admin /app/lib ./lib

ENV TZ=UTC
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

USER node

CMD [ "dumb-init", "pnpm", "run", "start" ]

# Default image: public site
FROM release-web
