FROM node:lts-alpine AS deps
USER root
WORKDIR /usr/local/lib/node_modules/npm
RUN npm install npm@latest -g --no-audit

WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY . ./
RUN npm run build && npm prune --production

FROM node:lts-alpine AS runtime
RUN apk --update --no-cache add dumb-init

USER root
WORKDIR /usr/local/lib/node_modules/npm
RUN npm install npm@latest -g --omit=dev --no-audit

RUN addgroup -S nupp && adduser -S -g nupp nupp

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOME=/home/nupp
ENV NODE_PATH=./node_modules
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

WORKDIR ${HOME}/app

COPY --chown=nupp:nupp --from=build /app/.next ${HOME}/app/.next
COPY --chown=nupp:nupp --from=build /app/public ${HOME}/app/public
COPY --chown=nupp:nupp --from=build /app/messages ${HOME}/app/messages
COPY --chown=nupp:nupp --from=build /app/package.json ${HOME}/app/package.json
COPY --chown=nupp:nupp --from=build /app/package-lock.json ${HOME}/app/package-lock.json
COPY --chown=nupp:nupp --from=build /app/next.config.ts ${HOME}/app/next.config.ts
COPY --chown=nupp:nupp --from=build /app/node_modules ${HOME}/app/node_modules

RUN chown -R nupp:nupp /usr/local

USER nupp

EXPOSE 3001/tcp

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:prod"]
