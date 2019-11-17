ARG DOCKER_TAG
FROM gitlab.open-xchange.com:4567/frontend/core/static:${DOCKER_TAG} as builder

COPY static/root/appsuite /usr/share/nginx/html/appsuite/

FROM nginx:alpine

COPY static/nginx /etc/nginx/
COPY static/entrypoint.sh /
COPY --from=builder /usr/share/nginx/html/appsuite /usr/share/nginx/html/appsuite

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
