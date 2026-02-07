FROM node:22.20.0 AS base

RUN apt-get update && apt-get install -y python3 wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

FROM base AS development

COPY common/ /app/common/

COPY frontend/ .

EXPOSE 3001

ENV PORT=3001
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev"]

FROM base AS builder

COPY common/ /app/common/

COPY frontend/ .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

RUN npm run build

FROM node:22.20.0-slim AS production

RUN apt-get update && apt-get install -y wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs && \
    chown -R nextjs:nodejs /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/common ./common
COPY --from=builder /app/next.config.js ./next.config.js

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001

ENV PORT=3001

CMD ["node", "server.js"]
