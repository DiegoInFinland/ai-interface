# AI Interface

A personal AI chat project for local development and use on my home network. It is **an ongoing, unfinished project** and is not intended for public exposure.

**Note:** This project is currently in beta and under active development. At the moment, only **Gemini** is supported. Integrations with ChatGPT and Claude are planned for the future, but progress may be slow due to my limited availability.

## Environment

Create a `.env` file in the project root using `.env.example` as a template:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
APP_BIND_ADDRESS=127.0.0.1
APP_PORT=3000
```

Keep `.env` out of Git. Preserve your existing file if it is already configured.

## Development

Requires Node.js 24 and pnpm 12.11.2.

```bash
pnpm install
pnpm dev
```

Open the URL printed by Vite, usually `http://localhost:5173`, and select **Gemini**. The development API runs on port 3000.

## Production (Docker)

Requires Docker with Docker Compose. The container serves both the frontend and API.

```bash
docker compose up -d --build
```

Open `http://localhost:3000`, or use the port configured by `APP_PORT`. Use a different port, such as 3001, if the development API is also running.

For home-network deployment, point your existing Nginx proxy at the configured address and port. Set `APP_BIND_ADDRESS` to the Docker host's LAN address if the proxy runs on another machine. Forward `/api` without changing its path and disable response buffering for streaming.

To stop:

```bash
docker compose down
```
