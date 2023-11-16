FROM node:21-bookworm as build
RUN apt-get update && apt-get install -y openssl
COPY package.json package-lock.json ./app/
WORKDIR /app
RUN npm install

FROM node:21-bookworm-slim
WORKDIR /app
COPY --from=build /app /app
COPY mint.js ./
RUN mkdir /data ./cache
ENV IMPORTER_INFILE=/data/transactions.csv
ENV ACTUAL_SERVER_URL=http://host.docker.internal:5006
CMD ["node", "mint.js"]
