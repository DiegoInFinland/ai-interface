# Repository guidance

## Commands
- Use pnpm; `pnpm-lock.yaml` is the lockfile. `pnpm-workspace.yaml` only configures dependency build permissions, not multiple packages. Preserve its `allowBuilds` entries, including native `better-sqlite3`.
- `pnpm dev` starts both Vite and Hono with concurrently. Use `pnpm dev:web` for Vite alone and `pnpm dev:api` for `tsx watch server/index.ts`. The API listens on port 3000.
- Verify with `pnpm lint` and `pnpm build`; build runs `tsc -b` before Vite. For typechecking alone use `pnpm exec tsc -b`; for focused linting use `pnpm exec eslint src/path/to/file.tsx`.
- No test runner or test script is configured.
- Backend typecheck: `pnpm exec tsc --ignoreConfig --noEmit --module esnext --moduleResolution bundler --target es2023 --types node --skipLibCheck --strict server/app.ts server/services/ai.ts server/index.ts`. TypeScript 6 requires `--ignoreConfig` when passing files explicitly.
- Known full-project lint failures: `src/components/ui/sidebar.tsx` violates `react-refresh/only-export-components`; `src/hooks/use-mobile.ts` violates `react-hooks/set-state-in-effect`. Run focused lint on changed files and report these separately when still present.

## Chat architecture and contracts
- `src/main.tsx` mounts `src/App.tsx` under `StrictMode`. App owns draft/provider/messages, loading/error state, and the active AbortController. Chat UI lives in `src/components/chat/`; editable shadcn components live in `src/components/ui/`.
- Flow: MessageComposer → App → `src/lib/chat-api.ts` → `server/app.ts` → `server/services/ai.ts`. The server entrypoint loads `dotenv/config` before importing the app and starts the Node adapter. Keep SDK imports and credentials on the server.
- `GET /api/health` returns plain text `ok`. `POST /api/chat` accepts `{ prompt: string, provider: string, stream?: boolean }`; prompt must be non-empty, and provider must be `ChatGPT`, `Gemini`, or `Claude`.
- Gemini is the only real provider. It uses `gemini-3.5-flash` with a 30-second SDK request timeout and on-demand client creation. ChatGPT and Claude return demo JSON replies; the initial UI provider is ChatGPT.
- Gemini with `stream: true` returns `application/x-ndjson`. Each newline-delimited event is `{ type: "delta", text: string }`, `{ type: "done" }`, or `{ type: "error", error: string }`. Delta text is incremental; successful streams end with done, failures with error. Preserve UTF-8 decoding and buffering across arbitrary network chunks.
- Non-streaming success and demo replies use `{ text: string }`. Errors before a stream starts use `{ error: string }`: 400 for invalid input, 503 for missing key, and for non-streaming provider failures 429 for quota/rate limits or 502 otherwise. Once streaming starts, provider failures are error events under HTTP 200. Do not expose raw SDK error messages to the browser.
- The browser requests streaming and supports JSON fallback. Update one assistant message per request using a stable ID. Stop preserves partial replies; New chat clears messages. Abort old requests and guard callbacks/finally blocks so they cannot mutate a newer chat or request. Propagate disconnects to the SDK AbortSignal and remove request listeners after completion.
- Conversation history is not sent; messages are memory-only and rendered as plain text. SQLite is installed but unused.
- For route checks, import the app from `server/app.ts` and use `app.request()` without starting a listener. Live Gemini checks require a configured key and may incur usage; mocked checks can exercise empty output, quota errors, stream framing, truncation, and cancellation.

## Current boundaries and configuration traps
- `vite.config.ts` uses React and Tailwind plugins, aliases `@` to `src/`, and proxies `/api` to `http://localhost:3000` during development. `pnpm build` outputs only frontend assets; `pnpm preview` has no API proxy. Production needs separate backend hosting and same-origin `/api` routing that preserves streaming.
- `GEMINI_API_KEY` comes from the root `.env` or backend environment; never prefix it with `VITE_` or put credentials in browser code, logs, or docs. Restart the API after environment changes. `.gitignore` excludes `.env` and `.env.*`, except for a sanitized `.env.example`; never commit real credentials in any file. Ignore rules do not untrack already committed files or remove them from history.
- `tsconfig.app.json` includes all of `src` with browser/Vite types. `tsconfig.node.json` covers only `vite.config.ts`, despite its name. Neither build configuration includes `server/`; use the explicit backend typecheck above until this boundary is changed.
- ESLint currently applies browser globals and React rules to every TS/TSX file, including `server/`; account for this when updating server lint configuration.
- TypeScript uses `verbatimModuleSyntax` and `erasableSyntaxOnly`: use type-only imports where appropriate and avoid enums or parameter properties. Unused locals and parameters fail typechecking.
- Tailwind v4 is imported from `src/index.css`; chat styles live in `src/App.css`. shadcn uses Radix Nova and Lucide icons. Theme tokens and `dark:` utilities follow the system `prefers-color-scheme` setting.
