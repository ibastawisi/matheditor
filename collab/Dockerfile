FROM node:24-slim
RUN npm install -g pnpm@12.6.0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY server.ts .
ENV NODE_ENV=production
EXPOSE 1234
# node runs the TypeScript source directly by stripping its types
CMD ["node", "server.ts"]
