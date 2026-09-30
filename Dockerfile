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
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time
ARG NEXT_PUBLIC_FASTAPI_URL
ENV NEXT_PUBLIC_FASTAPI_URL=$NEXT_PUBLIC_FASTAPI_URL
# metadataBase resolves Open Graph URLs in prerendered pages, so it's needed at build time too
ARG PUBLIC_URL
ENV PUBLIC_URL=$PUBLIC_URL
RUN pnpm exec prisma generate && pnpm build

FROM base
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start"]
