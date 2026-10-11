# AI Interface

A React and TypeScript chat app built with Vite, Tailwind CSS, and shadcn/ui, backed by a Hono API and Google's Gemini SDK.

## Features

- Gemini replies stream progressively into one assistant message over HTTP.
- Optional Google Search grounding for Gemini, with source links and Google Search suggestions.
- A Stop generation button cancels the active request and preserves partial text.
- New chat cancels an active request and clears the conversation.
- Provider selection and thinking/generation feedback.
- ChatGPT and Claude selections return demo replies; Gemini is the only connected AI provider.

Messages are stored in browser memory only. Each request sends the latest prompt, not conversation history. User messages remain plain text; assistant replies support GitHub Flavored Markdown and syntax-highlighted code blocks, with light/dark styles. Raw HTML is skipped. The Markdown renderer is loaded on demand when an assistant reply appears.

## Getting started

Use a Node.js version supported by Vite 8 (20.19+ or 22.12+) and pnpm.

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env` file in the project root with a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey):

```dotenv
GEMINI_API_KEY=your_gemini_api_key
```

The backend loads this file through `dotenv/config`. Keep the key server-side; do not use a `VITE_` prefix. `.env` and `.env.*` files are ignored by Git, except for a sanitized `.env.example`. Never commit real credentials, including in example files.

3. Start both servers:

```bash
pnpm dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Select **Gemini** in the provider dropdown (the initial selection is ChatGPT), then send a message. The API listens on port **3000**, and Vite proxies `/api` requests to it.

To try cancellation, ask for a long answer and click the square **Stop generation** button. Restart the backend after changing `.env`.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Vite and the API together using concurrently. |
| `pnpm dev:web` | Start Vite directly. |
| `pnpm dev:api` | Start the API with `tsx watch server/index.ts`. |
| `pnpm lint` | Run ESLint. |
| `pnpm exec tsc -b` | Check the frontend and Vite configuration; excludes `server/`. |
| `pnpm build` | Run those TypeScript checks and generate the frontend build in `dist/`. |
| `pnpm build:api` | Typecheck and compile the backend into `server-dist/`. |
| `pnpm build:all` | Build both the frontend and backend. |
| `pnpm check:api` | Typecheck the backend without emitting files. |
| `pnpm start` | Run the compiled backend; set `NODE_ENV=production` to also serve the frontend. |
| `pnpm preview` | Preview the frontend production build locally. |

No test runner is configured yet.

To typecheck the backend separately:

```bash
pnpm check:api
```

The latest checks passed for the build, backend typecheck, and linting of the chat integration files. Full-project lint still reports errors in `src/components/ui/sidebar.tsx` (mixed component/helper exports) and `src/hooks/use-mobile.ts` (state update inside an effect).

## API and streaming

`GET /api/health` returns `ok`.

`POST /api/chat` accepts:

```json
{
  "prompt": "Explain HTTP streaming in two sentences.",
  "provider": "Gemini",
  "stream": true,
  "googleSearch": false
}
```

Send the body with `Content-Type: application/json`. Zod validates requests through Hono's `@hono/zod-validator` middleware: `prompt` is trimmed and must be a non-empty string, `provider` must be `Gemini`, `ChatGPT`, or `Claude`, and optional `stream` and `googleSearch` flags must be booleans. Google Search can only be enabled for Gemini. Validated data is used directly by the route. Invalid fields and malformed JSON return **400** with an `error` string.

For Gemini with `stream: true`, the response uses `application/x-ndjson`: each line is a JSON event. Text events contain incremental chunks, not the full accumulated answer:

```jsonl
{"type":"delta","text":"HTTP streaming "}
{"type":"delta","text":"delivers data incrementally."}
{"type":"done"}
```

A provider failure after streaming starts produces a terminal error event instead of `done`:

```jsonl
{"type":"error","error":"Gemini could not generate a reply. Please try again."}
```

Without `stream: true`, Gemini returns a JSON object with a `text` field. ChatGPT and Claude always return that JSON shape with a demo response. The browser client supports both formats.

### Google Search grounding

Select **Gemini**, then enable **Google Search** below the composer. Ask a question that benefits from current web information. The server enables the SDK's `tools: [{ googleSearch: {} }]` configuration; Gemini decides whether to search. Grounding is off by default, and no search tool is sent for normal requests.

When Google provides grounding metadata, source links appear below the completed answer. Google's returned Search Suggestions HTML is shown in an isolated sandboxed iframe without script execution or access to the app's document. Assistant Markdown continues to skip raw HTML.

Grounded JSON responses include an optional `grounding` field:

```json
{
  "text": "An answer based on search results.",
  "grounding": {
    "sources": [{ "uri": "https://example.com", "title": "Example source" }],
    "searchEntryPoint": "Google-provided Search Suggestions HTML, when present"
  }
}
```

Grounded streams send an optional `grounding` event after text chunks and before `done`:

```jsonl
{"type":"grounding","grounding":{"sources":[{"uri":"https://example.com","title":"Example source"}]}}
{"type":"done"}
```

Metadata arriving in a final SDK chunk without text is preserved. Source URLs are limited to HTTP/HTTPS and deduplicated. If Gemini does not search or returns no grounding metadata, the reply has no source panel.

Google Search availability and usage charges depend on your model and project billing tier; see [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing). Access failures show an error rather than silently switching to an ungrounded answer.

Before streaming starts, invalid requests return **400** and a missing Gemini key returns **503**. Non-streaming Gemini failures return **429** for quota/rate limits or **502** for other failures. Error responses contain an `error` field; errors during a stream are delivered as events under the already-started HTTP **200** response.

The service uses `gemini-3.5-flash` with a 30-second SDK request timeout. Stop generation aborts the browser request and propagates cancellation to the SDK. Cancellation does not guarantee that provider-side work or billing stops immediately.

### Test the API directly

With the API running, execute:

```bash
curl --no-buffer http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a short explanation of HTTP streaming.","provider":"Gemini","stream":true}'
```

Expect `delta` events followed by `done`. Omit `stream` to receive a single JSON response. In the browser, inspect `/api/chat` under Developer Tools → Network to confirm the request and response.

For a grounded request, add `"googleSearch": true` and use a prompt such as “Search for the official Node.js release schedule and summarize it.”

## Styling and themes

Tailwind CSS v4 is integrated through the official `@tailwindcss/vite` plugin in `vite.config.ts` and imported in `src/index.css`. Chat layout, controls, responsive behavior, and Markdown elements are styled with utility classes directly in the React components.

```tsx
<section className="flex items-center gap-4 rounded-lg bg-accent-soft p-6 text-strong">
  Your content
</section>
```

The existing light/dark backgrounds, text colors, and purple accents are preserved. Dark mode follows the system's `prefers-color-scheme` setting, including Tailwind's `dark:` variant. shadcn's background, foreground, primary, border, and focus-ring tokens are connected to the existing palette.

Customize theme tokens and global styles in `src/index.css`.

App-specific theme utilities include `text-strong`, `bg-accent-soft`, `border-accent-border`, and `bg-code`. `MarkdownMessage.tsx` applies utilities to Markdown elements; the small `src/components/chat/syntax.css` stylesheet colors the token classes generated by the highlighting plugin.

## shadcn/ui components

shadcn/ui is initialized with the **Radix Nova** style and Lucide icons. Components are added as editable source files in `src/components/ui/`, rather than hidden inside a component package.

Editable components include Button, Textarea, Card, Sidebar, and other UI primitives. Add more components with:

```bash
pnpm exec shadcn add card input dialog
```

Import components using the `@/` alias, which resolves to `src/`:

```tsx
import { Button } from '@/components/ui/button'

function Example() {
  return <Button>Continue</Button>
}
```

Component generation settings live in `components.json`. The `cn` helper in `src/lib/utils.ts` is available for composing class names. Import aliases are configured in Vite and the TypeScript configurations.

## Project structure

```text
server/
  index.ts                 # dotenv loading and Node HTTP listener on port 3000
  app.ts                   # Hono health/chat routes and streaming transport
  services/ai.ts           # Server-side Gemini generation and streaming
src/
  components/chat/         # Chat header, conversation, composer, and suggestions
    syntax.css             # Generated syntax-token colors (loaded with Markdown)
  components/ui/           # Editable shadcn/ui components
  lib/chat-api.ts          # Browser HTTP client and NDJSON stream parsing
  lib/utils.ts             # Class-name helper
  App.tsx                  # Chat state, incremental replies, and cancellation
  index.css                # Tailwind imports, themes, and global styles
  main.tsx                 # React entrypoint
components.json            # shadcn/ui configuration
Dockerfile                 # Multi-stage Node 24 production image
compose.yaml               # One app service for the existing reverse proxy
.dockerignore              # Excludes credentials and local/generated files
tsconfig.server.json       # Backend typechecking and Node ESM output
vite.config.ts             # Plugins, import alias, and development API proxy
```

## Docker deployment with your existing Nginx proxy

One container serves the built frontend and API on port **3000**. There is no Nginx service in this project's Compose file; point your existing proxy at the app's HTTP endpoint and forward both `/` and `/api` without stripping their paths.

Keep `GEMINI_API_KEY` in the root `.env` on the deployment host. Docker Compose injects it into the container at runtime; `.dockerignore` excludes `.env` and `.env.*` from the image build. `.env.example` lists the available environment settings without credentials.

Build and start:

```bash
docker compose up -d --build
```

The default published endpoint is `http://127.0.0.1:3000`, suitable for Nginx running directly on the same Docker host. Check the container using:

```bash
docker compose ps
```

If your proxy runs on another machine in your LAN, set these optional values in `.env` (replace the example address with the Docker host's actual LAN address):

```dotenv
APP_BIND_ADDRESS=192.168.1.50
APP_PORT=3000
```

Then recreate the container and set your proxy's upstream to `http://192.168.1.50:3000`. If your proxy is another Docker container, attach both services to its existing shared Docker network and use the app's network hostname on port 3000; `127.0.0.1` inside the proxy container refers to the proxy itself.

For Gemini streaming, disable response buffering for `/api/chat` in the existing proxy and allow a read timeout longer than the SDK's 30 seconds (for example, 60 seconds). Your proxy can handle TLS as it already does for other services.

The image runs as the non-root `node` user with production dependencies. Compose uses a read-only filesystem, a writable `/tmp`, dropped Linux capabilities, and a healthcheck at `/api/health`. Credentials are not needed at build time. After changing the key in `.env`, apply it with:

```bash
docker compose up -d --force-recreate
```

For a local production check without Docker:

```bash
pnpm build:all
NODE_ENV=production pnpm start
```

`pnpm build` still builds only the frontend, and `pnpm preview` still has no API proxy. Production static serving is enabled by `NODE_ENV=production`; unknown API routes and missing `/assets/` files return 404 rather than the SPA HTML.

SQLite is installed but is not used yet; there is no persisted conversation storage.
