FROM node:14.16.0 as builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json package-lock.json /usr/src/app/
RUN npm install --non-interactive --production


FROM node:14.16.0 as release

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN mkdir data outputs

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules

COPY . /usr/src/app
