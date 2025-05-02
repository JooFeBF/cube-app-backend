FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

COPY database.json ./
COPY migrations ./migrations

RUN pnpm run build

RUN pnpm prune --prod

FROM node:20-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm db-migrate db-migrate-mysql


COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

COPY --from=builder /usr/src/app/database.json ./
COPY --from=builder /usr/src/app/migrations ./migrations

EXPOSE 4000

CMD ["node", "dist/main.js"]


