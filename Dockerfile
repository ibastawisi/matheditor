FROM node:24-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.6.0
# PDFs are rendered by the browserless service, no local Chrome needed
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time
ARG NEXT_PUBLIC_FASTAPI_URL
ARG NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
ENV NEXT_PUBLIC_FASTAPI_URL=$NEXT_PUBLIC_FASTAPI_URL \
  NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=$NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
RUN pnpm exec prisma generate && pnpm build

FROM base
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start"]
