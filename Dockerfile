###############################################################################
# Step 1 : Builder image
#
FROM node:16-alpine AS builder

WORKDIR /usr/app

COPY package.json tsconfig.json ./
COPY ./src ./src

RUN npm install
RUN npm run build

###############################################################################
# Step 2 : Run image
#
FROM node:16-alpine

ENV NODE_ENV=production
ENV DEBUG=info

WORKDIR /usr/app

COPY package.json tsconfig.json ./

RUN npm install --production 

COPY --from=builder /usr/app/dist ./dist

CMD [ "npm", "run", "serve" ]
