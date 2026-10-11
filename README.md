# AI Interface

A React and TypeScript chat app built with Vite, Tailwind CSS, and shadcn/ui, backed by a Hono API and Google's Gemini SDK.

## Features

- Gemini replies stream progressively into one assistant message over HTTP.
- A Stop generation button cancels the active request and preserves partial text.
- New chat cancels an active request and clears the conversation.
- Prompt suggestions, provider selection, and thinking/generation feedback.
- ChatGPT and Claude selections return demo replies; Gemini is the only connected AI provider.

Messages are stored in browser memory only. Each request sends the latest prompt, not conversation history. Replies are rendered as plain text, without Markdown formatting.

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
| `pnpm preview` | Preview the frontend production build locally. |

No test runner is configured yet.

To typecheck the backend separately:

```bash
pnpm exec tsc --ignoreConfig --noEmit --module esnext --moduleResolution bundler --target es2023 --types node --skipLibCheck --strict server/app.ts server/services/ai.ts server/index.ts
```

The latest checks passed for the build, backend typecheck, and linting of the chat integration files. Full-project lint still reports errors in `src/components/ui/sidebar.tsx` (mixed component/helper exports) and `src/hooks/use-mobile.ts` (state update inside an effect).

## API and streaming

`GET /api/health` returns `ok`.

`POST /api/chat` accepts:

```json
{
  "prompt": "Explain HTTP streaming in two sentences.",
  "provider": "Gemini",
  "stream": true
}
```

`prompt` must be a non-empty string. Supported providers are `Gemini`, `ChatGPT`, and `Claude`.

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

## Styling and themes

Tailwind CSS **v4.3.3** is integrated through the official `@tailwindcss/vite` plugin in `vite.config.ts`. Its stylesheet is imported in `src/index.css`, so utility classes can be used directly in React components.

```tsx
<section className="flex items-center gap-4 rounded-lg p-6">
  Your content
</section>
```

The existing light/dark backgrounds, text colors, and purple accents are preserved. Dark mode follows the system's `prefers-color-scheme` setting, including Tailwind's `dark:` variant. shadcn's background, foreground, primary, border, and focus-ring tokens are connected to the existing palette.

Customize theme tokens and global styles in `src/index.css`.

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
  components/ui/           # Editable shadcn/ui components
  lib/chat-api.ts          # Browser HTTP client and NDJSON stream parsing
  lib/utils.ts             # Class-name helper
  App.tsx                  # Chat state, incremental replies, and cancellation
  App.css                  # Chat layout and styles
  index.css                # Tailwind imports, themes, and global styles
  main.tsx                 # React entrypoint
components.json            # shadcn/ui configuration
vite.config.ts             # Plugins, import alias, and development API proxy
```

## Deployment boundaries

The build produces frontend assets only. `pnpm preview` does not start the API or configure an API proxy. Production hosting needs a separately running backend and routing for `/api` on the frontend origin, with streaming preserved through any reverse proxy.

SQLite is installed but is not used yet; there is no persisted conversation storage.
