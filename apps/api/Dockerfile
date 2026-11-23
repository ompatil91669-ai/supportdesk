FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /workspace/apps/api

COPY apps/api/package*.json ./
COPY apps/api/database ./database
RUN npm ci

COPY apps/api/src ./src
COPY apps/api/tsconfig.json ./tsconfig.json
RUN cd database && DATABASE_URL=postgresql://supportdesk:build-only@localhost:5432/supportdesk npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "cd database && npx prisma migrate deploy && cd .. && npm start"]
