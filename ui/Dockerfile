FROM gitlab.open-xchange.com:4567/frontend/dev_env:0.0.2

MAINTAINER Julian Bäume <julian.baeume@open-xchange.com>

ENTRYPOINT ["/app/run.sh"]
CMD ["serve"]

COPY build /app/build/
COPY dist /app/dist/
