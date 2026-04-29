FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev --no-audit --no-fund \
  && npm cache clean --force

COPY app.js ./

USER node

EXPOSE 3000

CMD ["npm", "start"]
