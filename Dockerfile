FROM node:16.13-alpine AS packages
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases
COPY .yarn/plugins .yarn/plugins
COPY packages packages
RUN find packages \! -name package.json -mindepth 2 -maxdepth 2 -exec rm -rf {} +

FROM node:16.13-alpine AS deps
WORKDIR /app
RUN apk add --no-cache alpine-sdk libc6-compat python3
COPY --from=packages /app .
RUN yarn install --immutable

FROM node:16.13-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app .
RUN yarn build

FROM node:16.13-alpine
WORKDIR /app
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S westegg -u 1001

COPY --from=packages /app .
COPY --from=builder /app/.yarn .yarn
COPY --from=builder /app/packages packages
COPY --from=builder /app/.pnp.cjs .
COPY --from=builder --chown=westegg:nodejs /app/dist dist
RUN find packages \! \( -name package.json -o -name dist \) -mindepth 2 -maxdepth 2 -exec rm -rf {} +

USER westegg
EXPOSE 3001

CMD ["yarn", "node", "."]
