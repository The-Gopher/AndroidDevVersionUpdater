# Runs the apk-indexer as a plain HTTP service that accepts CloudEvents, which is what
# Eventarc delivers to Cloud Run. The same image runs anywhere that can send it a
# CloudEvent: Cloud Run, a VM, or `docker run` for local testing.

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Not root. Cloud Run does not need it, and the process only makes outbound calls.
USER node
# Cloud Run injects PORT; functions-framework honours it and defaults to 8080.
CMD ["node_modules/.bin/functions-framework", "--source=dist/index.js", "--target=apk-indexer", "--signature-type=cloudevent"]
