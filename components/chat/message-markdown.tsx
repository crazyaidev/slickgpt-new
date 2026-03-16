"use client"

import type { ComponentPropsWithoutRef } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageMarkdownProps {
  content: string
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-4 text-[15px] leading-7 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="mb-3 mt-6 text-2xl font-semibold tracking-tight first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-semibold tracking-tight first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold tracking-tight first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h4>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-6 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-6 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="pl-1 marker:text-muted-foreground">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-border/80 bg-muted/40 px-4 py-3 text-[15px] italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-border" />,
  a: ({ href, children }) => {
    if (!href) {
      return <span>{children}</span>
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
      >
        <span>{children}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    )
  },
  pre: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-2xl border border-border/80 bg-zinc-950 text-zinc-50 shadow-sm">
      <pre className="min-w-full p-4 text-[13px] leading-6">{children}</pre>
    </div>
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          {...props}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] font-medium text-foreground"
        >
          {children}
        </code>
      )
    }

    return (
      <code
        {...props}
        className={cn("font-mono text-[13px] text-zinc-50", className)}
      >
        {children}
      </code>
    )
  },
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-border/80">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border/70">{children}</tbody>,
  tr: ({ children }) => <tr className="align-top">{children}</tr>,
  th: ({ children }) => (
    <th className="border-b border-border/80 px-4 py-3 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-3 text-foreground/90">{children}</td>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-muted-foreground">{children}</del>,
  input: ({ checked, ...props }) => {
    const inputProps = props as ComponentPropsWithoutRef<"input">

    if (inputProps.type !== "checkbox") {
      return <input {...inputProps} readOnly disabled />
    }

    return (
      <input
        {...inputProps}
        checked={checked}
        readOnly
        disabled
        className="mr-2 h-4 w-4 rounded border-border accent-primary"
      />
    )
  },
}

export function MessageMarkdown({ content }: MessageMarkdownProps) {
  return (
    <div className="min-w-0 break-words text-[15px] leading-7 [overflow-wrap:anywhere]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
