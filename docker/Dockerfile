FROM registry.gitlab.open-xchange.com/frontend/dev_env:latest

MAINTAINER Julian Bäume <julian.baeume@open-xchange.com>

# Ensure pnpm is available
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate || npm install -g pnpm@10.0.0

COPY build /app/build/
COPY dist /app/dist/
