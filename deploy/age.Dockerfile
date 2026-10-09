# age for the backup script (not in the Oracle Linux repos): `docker run --rm -i kawsay-age ...`.
FROM alpine:3.22
RUN apk add --no-cache age
ENTRYPOINT ["age"]
