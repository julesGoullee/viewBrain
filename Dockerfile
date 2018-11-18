FROM node:8.12.0 as builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json yarn.lock /usr/src/app/
RUN yarn install --non-interactive --production


FROM node:8.12.0 as release

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

CMD ["yarn", "app"]
