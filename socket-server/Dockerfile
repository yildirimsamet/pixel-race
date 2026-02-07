FROM node:18-alpine AS base

WORKDIR /app

COPY socket-server/package*.json ./

FROM base AS development

RUN npm install

COPY common/ /app/common/

COPY socket-server/ .

EXPOSE 3000

ENV NODE_ENV=development

CMD ["npx", "nodemon", "server.js"]

FROM base AS production

RUN npm ci --only=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 socketuser && \
    chown -R socketuser:nodejs /app

COPY common/ /app/common/

COPY socket-server/ .

RUN chown -R socketuser:nodejs /app

USER socketuser

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
