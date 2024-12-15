FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine as runner

WORKDIR /app

RUN apk add --no-cache git

RUN git clone https://github.com/SwapnilSoni1999/spotify-dl
RUN cd spotify-dl
RUN npm install
RUN npm link

COPY --from=builder /app/ ./

RUN npm ci --only=production

ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "start"]
