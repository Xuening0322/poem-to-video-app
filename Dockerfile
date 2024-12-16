FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine as runner

WORKDIR /app

# Install required packages including FFmpeg
RUN apk update && \
    apk add --no-cache git \
                       ffmpeg \
                       python3 \
    && ln -s /usr/bin/ffmpeg /usr/local/bin/ffmpeg \
    && ln -s /usr/bin/ffprobe /usr/local/bin/ffprobe

# Verify FFmpeg installation
RUN ffmpeg -version && \
    which ffmpeg

# Install spotify-dl
RUN git clone https://github.com/SwapnilSoni1999/spotify-dl /spotify-dl \
    && cd /spotify-dl \
    && npm install \
    && npm link

COPY --from=builder /app/ ./

RUN npm ci --only=production

ENV NODE_ENV=production
ENV PATH="/usr/bin:/usr/local/bin:${PATH}"

EXPOSE 8080

CMD ["npm", "start"]
