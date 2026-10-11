import { ExternalLink, Globe } from "lucide-react";
import type { GroundingData } from "@/lib/chat-api";

export function GroundingSources({ grounding }: { grounding: GroundingData }) {
  return (
    <aside className="mt-[16px] space-y-[12px] border-t border-border pt-[12px] text-[12px]" aria-label="Google Search grounding">
      {grounding.sources.length > 0 && (
        <>
          <p className="flex items-center gap-[6px] font-semibold text-foreground">
            <Globe size={14} aria-hidden="true" /> Sources
          </p>
          <ol className="flex flex-wrap gap-[8px]">
            {grounding.sources.map((source, index) => (
              <li className="min-w-0 max-w-full" key={source.uri}>
                <a
                  className="inline-flex max-w-full items-center gap-[6px] rounded-full border border-border px-[10px] py-[5px] text-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="shrink-0">{index + 1}.</span>
                  <span className="truncate">{source.title}</span>
                  <ExternalLink className="shrink-0" size={12} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </>
      )}
      {grounding.searchEntryPoint && (
        <iframe
          className="h-[160px] w-full border-0"
          title="Google Search suggestions"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          srcDoc={`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'"><style>:root{color-scheme:light dark}body{margin:0}</style></head><body>${grounding.searchEntryPoint}</body></html>`}
        />
      )}
    </aside>
  );
}
