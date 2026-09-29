FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npx playwright install --with-deps chromium

ENV NODE_ENV=production
ENV NEVERA_DASHBOARD_PORT=8787
ENV NEVERA_DASHBOARD_PUBLIC=true
ENV NEVERA_DASHBOARD_TOKEN=
ENV NEVERA_STATE_FILE=/data/nevera-state.json
ENV NEVERA_CYCLES=0

EXPOSE 8787

CMD ["node", "scripts/service.js"]
