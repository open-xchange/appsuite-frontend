FROM gitlab.open-xchange.com:4567/frontend/dev_env:latest

MAINTAINER Julian Bäume <julian.baeume@open-xchange.com>

COPY docker/build /app/build/
COPY docker/dist /app/dist/
