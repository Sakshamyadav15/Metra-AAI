FROM node:20-slim

WORKDIR /app

# Install backend dependencies only
COPY email-triage-agent/server/package.json ./email-triage-agent/server/package.json
RUN npm install --prefix ./email-triage-agent/server

# Copy backend source
COPY email-triage-agent/server ./email-triage-agent/server

# Hugging Face Spaces expects the app on port 7860
ENV NODE_ENV=production
ENV PORT=7860
ENV DB_PATH=/data/triage.db
ENV SESSION_DB_PATH=/data/sessions.sqlite
ENV ASYNC_TRIAGE=true
ENV REDIS_REQUIRED=false

RUN mkdir -p /data

EXPOSE 7860

CMD ["node", "email-triage-agent/server/index.js"]
