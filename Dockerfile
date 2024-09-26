FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine as runner

WORKDIR /app

COPY --from=builder /app/ ./

RUN npm ci --only=production

ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "start"]
