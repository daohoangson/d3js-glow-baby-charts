FROM alpine:3.9 as now-cli-downloader

# https://circleci.com/gh/zeit/now-cli/tree/now-dev
RUN wget -O /usr/local/bin/now 'https://latest-now-cli.now.sh/download/17678/now-alpine' \
  && chmod +x /usr/local/bin/now

FROM node:10.15.3-alpine

RUN npm i -g --unsafe-perm now

RUN npm i -g micro-ts-dev

COPY --from=now-cli-downloader /usr/local/bin/now /usr/local/bin/now-alpine
