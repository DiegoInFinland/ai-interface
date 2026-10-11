import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import "./syntax.css";

const headingClasses = "mt-[24px] mb-[10px] leading-[1.3] font-[650] text-strong";
const focusClasses = "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent";

// Styling stays alongside the generated elements instead of a page stylesheet.
const components: Components = {
  h1: ({ children }) => <h1 className={`${headingClasses} text-[1.6em]`}>{children}</h1>,
  h2: ({ children }) => <h2 className={`${headingClasses} text-[1.35em]`}>{children}</h2>,
  h3: ({ children }) => <h3 className={`${headingClasses} text-[1.15em]`}>{children}</h3>,
  h4: ({ children }) => <h4 className={`${headingClasses} text-[1em]`}>{children}</h4>,
  h5: ({ children }) => <h5 className={`${headingClasses} text-[1em]`}>{children}</h5>,
  h6: ({ children }) => <h6 className={`${headingClasses} text-[1em]`}>{children}</h6>,
  p: ({ children }) => <p className="mb-[12px] whitespace-normal">{children}</p>,
  strong: ({ children }) => <strong className="font-[650]">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children, className }) => (
    <ul className={cn("my-[12px] list-disc pl-[24px] [&.contains-task-list]:list-none", className)}>{children}</ul>
  ),
  ol: ({ children, start }) => <ol className="my-[12px] list-decimal pl-[24px]" start={start}>{children}</ol>,
  li: ({ children, className }) => <li className={cn("my-[4px] [&>p]:mb-[6px]", className)}>{children}</li>,
  input: ({ checked, disabled, type }) => (
    <input className="mr-[8px] accent-accent" checked={checked} disabled={disabled} type={type} readOnly />
  ),
  a: ({ children, href, title }) => (
    <a className={`text-accent underline underline-offset-3 ${focusClasses}`} href={href} title={title}>{children}</a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-[16px] border-l-[3px] border-accent-border px-[16px] py-[4px] text-foreground [&>:last-child]:mb-0">{children}</blockquote>
  ),
  hr: () => <hr className="my-[24px] border-t border-border" />,
  code: ({ children, className }) => (
    <code className={cn("rounded-[4px] bg-code px-[5px] py-[2px] font-mono text-[0.88em]", className)}>{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-[16px] max-w-full overflow-x-auto rounded-[12px] border border-border bg-code p-[16px] leading-[1.6] whitespace-pre [overflow-wrap:normal] [tab-size:2] [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0">{children}</pre>
  ),
  table: ({ children }) => (
    <div className={`my-[16px] max-w-full overflow-x-auto ${focusClasses}`} role="region" aria-label="Table" tabIndex={0}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children, style }) => <th className="border border-border bg-code px-[12px] py-[8px] font-[650]" style={style}>{children}</th>,
  td: ({ children, style }) => <td className="border border-border px-[12px] py-[8px]" style={style}>{children}</td>,
  img: ({ alt, src, title }) => <img className="h-auto max-w-full rounded-[8px]" alt={alt ?? ""} src={src} title={title} />,
};

export default function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="syntax-highlight mt-[12px] text-[15px] leading-[1.7] [overflow-wrap:anywhere] [&>:first-child]:mt-0 [&>:last-child]:mb-0">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
