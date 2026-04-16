"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { mergeAttributes, Node, type JSONContent } from "@tiptap/core"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"
import { EditorContent, useEditor } from "@tiptap/react"
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  Loader2,
  Quote,
} from "lucide-react"
import { marked } from "marked"
import { DataTag, type DataTagTone } from "@/components/shared/data-tag"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface EmailTemplateTokenDefinition {
  label: string
  description: string
  token: string
  tone?: DataTagTone
}

interface EmailTemplateEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  subjectLabel: string
  subjectPlaceholder: string
  bodyLabel: string
  bodyPlaceholder: string
  toolbarLabel: string
  emptyTokensLabel: string
  subjectValue: string
  bodyValue: string
  onSave: (values: { subject: string; body: string }) => void
  tokens: EmailTemplateTokenDefinition[]
  actions: {
    cancel: string
    save: string
    bold: string
    italic: string
    heading1: string
    heading2: string
    list: string
    quote: string
    code: string
    link: string
  }
}

type EditorField = "subject" | "body"

const TOKEN_PATTERN = /{{[^}]+}}/g

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function resolveTokenChipClass(tone: DataTagTone | undefined) {
  switch (tone) {
    case "success":
      return "inline-flex items-center rounded-md border border-transparent bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
    case "warning":
      return "inline-flex items-center rounded-md border border-transparent bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
    case "danger":
      return "inline-flex items-center rounded-md border border-transparent bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
    case "accent":
      return "inline-flex items-center rounded-md border border-transparent bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
    case "neutral":
      return "inline-flex items-center rounded-md border border-transparent bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-500/10 dark:text-slate-300"
    case "info":
    default:
      return "inline-flex items-center rounded-md border border-transparent bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-400"
  }
}

const EmailTokenNode = Node.create({
  name: "emailToken",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,
  defining: true,

  addAttributes() {
    return {
      token: {
        default: "",
      },
      label: {
        default: "",
      },
      tone: {
        default: "info",
      },
    }
  },

  parseHTML() {
    return [
      { tag: "email-token" },
      { tag: "span[data-email-token]" },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-email-token": HTMLAttributes.token,
        "data-email-label": HTMLAttributes.label,
        "data-email-tone": HTMLAttributes.tone,
        class: resolveTokenChipClass(HTMLAttributes.tone as DataTagTone | undefined),
      }),
      HTMLAttributes.label,
    ]
  },
})

function tokensToHtmlTags(value: string, tokensByToken: Map<string, EmailTemplateTokenDefinition>) {
  return value.replace(TOKEN_PATTERN, (token) => {
    const definition = tokensByToken.get(token)
    const label = definition?.label ?? token
    const tone = definition?.tone ?? "info"
    return `<email-token token="${escapeHtml(token)}" label="${escapeHtml(label)}" tone="${escapeHtml(
      tone,
    )}"></email-token>`
  })
}

function buildSubjectHtml(value: string, tokensByToken: Map<string, EmailTemplateTokenDefinition>) {
  const segments: string[] = []
  let cursor = 0

  for (const match of value.matchAll(TOKEN_PATTERN)) {
    const token = match[0]
    const index = match.index ?? 0
    if (index > cursor) {
      segments.push(escapeHtml(value.slice(cursor, index)))
    }
    const definition = tokensByToken.get(token)
    const label = definition?.label ?? token
    const tone = definition?.tone ?? "info"
    segments.push(
      `<email-token token="${escapeHtml(token)}" label="${escapeHtml(label)}" tone="${escapeHtml(
        tone,
      )}"></email-token>`,
    )
    cursor = index + token.length
  }

  if (cursor < value.length) {
    segments.push(escapeHtml(value.slice(cursor)))
  }

  return `<p>${segments.join("") || ""}</p>`
}

function buildBodyHtml(value: string, tokensByToken: Map<string, EmailTemplateTokenDefinition>) {
  const markdownWithTokens = tokensToHtmlTags(value, tokensByToken)
  const html = marked.parse(markdownWithTokens, {
    async: false,
    breaks: true,
    gfm: true,
  })

  return typeof html === "string" ? html : ""
}

function serializeInline(nodes: JSONContent[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        const rawText = node.text ?? ""
        const marks = node.marks ?? []
        let value = rawText

        const codeMark = marks.find((mark) => mark.type === "code")
        if (codeMark) {
          value = `\`${value}\``
        }

        const italicMark = marks.find((mark) => mark.type === "italic")
        if (italicMark) {
          value = `_${value}_`
        }

        const boldMark = marks.find((mark) => mark.type === "bold")
        if (boldMark) {
          value = `**${value}**`
        }

        const linkMark = marks.find((mark) => mark.type === "link")
        if (linkMark?.attrs?.href) {
          value = `[${value}](${linkMark.attrs.href})`
        }

        return value
      }

      if (node.type === "emailToken") {
        return String(node.attrs?.token ?? "")
      }

      if (node.type === "hardBreak") {
        return "\n"
      }

      return serializeInline(node.content ?? [])
    })
    .join("")
}

function serializeListItem(node: JSONContent) {
  const lines = (node.content ?? [])
    .map((child) => serializeBlockNode(child))
    .filter((value) => value.trim().length > 0)

  if (!lines.length) return "- "

  return lines
    .flatMap((line, index) =>
      line.split("\n").map((item, itemIndex) => {
        if (index === 0 && itemIndex === 0) return `- ${item}`
        return `  ${item}`
      }),
    )
    .join("\n")
}

function serializeBlockNode(node: JSONContent): string {
  switch (node.type) {
    case "paragraph":
      return serializeInline(node.content ?? [])
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6)
      return `${"#".repeat(level)} ${serializeInline(node.content ?? [])}`.trim()
    }
    case "bulletList":
      return (node.content ?? []).map((item) => serializeListItem(item)).join("\n")
    case "blockquote": {
      const body = serializeNodes(node.content ?? [])
      return body
        .split("\n")
        .map((line) => (line.trim().length ? `> ${line}` : ">"))
        .join("\n")
    }
    case "horizontalRule":
      return "---"
    default:
      return serializeInline(node.content ?? [])
  }
}

function serializeNodes(nodes: JSONContent[] = []) {
  return nodes
    .map((node) => serializeBlockNode(node))
    .filter((value) => value.trim().length > 0)
    .join("\n\n")
}

function serializeSubject(nodes: JSONContent[] = []) {
  return serializeNodes(nodes)
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function serializeBody(nodes: JSONContent[] = []) {
  return serializeNodes(nodes).trim()
}

const subjectExtensions = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    bulletList: false,
    orderedList: false,
    codeBlock: false,
    code: false,
    horizontalRule: false,
    hardBreak: false,
    strike: false,
    bold: false,
    italic: false,
  }),
  Placeholder.configure({
    placeholder: "",
  }),
  EmailTokenNode,
]

const bodyExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2],
    },
    orderedList: false,
    codeBlock: false,
    strike: false,
  }),
  Link.configure({
    openOnClick: false,
    autolink: false,
    defaultProtocol: "https",
  }),
  Placeholder.configure({
    placeholder: "",
  }),
  EmailTokenNode,
]

export function EmailTemplateEditorDialog({
  open,
  onOpenChange,
  title,
  description,
  subjectLabel,
  subjectPlaceholder,
  bodyLabel,
  bodyPlaceholder,
  toolbarLabel,
  emptyTokensLabel,
  subjectValue,
  bodyValue,
  onSave,
  tokens,
  actions,
}: EmailTemplateEditorDialogProps) {
  const [activeField, setActiveField] = useState<EditorField>("body")
  const [draftSubject, setDraftSubject] = useState(subjectValue)
  const [draftBody, setDraftBody] = useState(bodyValue)
  const [isSaving, setIsSaving] = useState(false)

  const tokensByToken = useMemo(() => new Map(tokens.map((token) => [token.token, token])), [tokens])

  const subjectEditor = useEditor({
    immediatelyRender: false,
    extensions: subjectExtensions,
    content: buildSubjectHtml(subjectValue, tokensByToken),
    autofocus: false,
    editorProps: {
      attributes: {
        class:
          "min-h-10 w-full select-text px-3 py-2 text-sm outline-none [&_p]:m-0 [&_span[data-email-token]]:mx-0.5 [&_span[data-email-token]]:align-baseline",
      },
      handleKeyDown: (_, event) => event.key === "Enter",
    },
    onFocus: () => setActiveField("subject"),
    onUpdate: ({ editor }) => {
      setDraftSubject(serializeSubject(editor.getJSON().content ?? []))
    },
  })

  const bodyEditor = useEditor({
    immediatelyRender: false,
    extensions: bodyExtensions,
    content: buildBodyHtml(bodyValue, tokensByToken),
    autofocus: false,
    editorProps: {
      attributes: {
        class:
          "min-h-72 w-full select-text px-4 py-3 text-sm outline-none [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:mb-1 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_span[data-email-token]]:mx-0.5 [&_span[data-email-token]]:align-baseline [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
    onFocus: () => setActiveField("body"),
    onUpdate: ({ editor }) => {
      setDraftBody(serializeBody(editor.getJSON().content ?? []))
    },
  })

  useEffect(() => {
    if (!open) return
    setDraftSubject(subjectValue)
    setDraftBody(bodyValue)
    setActiveField("body")
    setIsSaving(false)

    subjectEditor?.commands.setContent(buildSubjectHtml(subjectValue, tokensByToken), {
      emitUpdate: false,
    })
    bodyEditor?.commands.setContent(buildBodyHtml(bodyValue, tokensByToken), {
      emitUpdate: false,
    })
  }, [bodyEditor, bodyValue, open, subjectEditor, subjectValue, tokensByToken])

  const availableTokens = useMemo(() => tokens, [tokens])

  const toolbarDisabled = activeField !== "body" || !bodyEditor

  const applyBodyCommand = (command: () => void) => {
    if (!bodyEditor) return
    bodyEditor.chain().focus().run()
    command()
  }

  const insertToken = (token: EmailTemplateTokenDefinition) => {
    const targetEditor = activeField === "subject" ? subjectEditor : bodyEditor
    if (!targetEditor) return

    targetEditor
      .chain()
      .focus()
      .insertContent({
        type: "emailToken",
        attrs: {
          token: token.token,
          label: token.label,
          tone: token.tone ?? "info",
        },
      })
      .insertContent(activeField === "subject" ? " " : "")
      .run()
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const nextSubject = subjectEditor ? serializeSubject(subjectEditor.getJSON().content ?? []) : draftSubject
      const nextBody = bodyEditor ? serializeBody(bodyEditor.getJSON().content ?? []) : draftBody

      onSave({
        subject: nextSubject,
        body: nextBody,
      })

      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-3 text-sm font-medium">{toolbarLabel}</div>
            <div className="flex flex-wrap gap-2">
              <ToolbarButton
                icon={<Heading1 className="h-4 w-4" />}
                label={actions.heading1}
                disabled={toolbarDisabled}
                onClick={() => applyBodyCommand(() => bodyEditor?.chain().focus().toggleHeading({ level: 1 }).run())}
              />
              <ToolbarButton
                icon={<Heading2 className="h-4 w-4" />}
                label={actions.heading2}
                disabled={toolbarDisabled}
                onClick={() => applyBodyCommand(() => bodyEditor?.chain().focus().toggleHeading({ level: 2 }).run())}
              />
              <ToolbarButton
                icon={<Bold className="h-4 w-4" />}
                label={actions.bold}
                disabled={toolbarDisabled}
                onClick={() => applyBodyCommand(() => bodyEditor?.chain().focus().toggleBold().run())}
              />
              <ToolbarButton
                icon={<Italic className="h-4 w-4" />}
                label={actions.italic}
                disabled={toolbarDisabled}
                onClick={() => applyBodyCommand(() => bodyEditor?.chain().focus().toggleItalic().run())}
              />
              <ToolbarButton
                icon={<List className="h-4 w-4" />}
                label={actions.list}
                disabled={toolbarDisabled}
                onClick={() => applyBodyCommand(() => bodyEditor?.chain().focus().toggleBulletList().run())}
              />
              <ToolbarButton
                icon={<Quote className="h-4 w-4" />}
                label={actions.quote}
                disabled={toolbarDisabled}
                onClick={() => applyBodyCommand(() => bodyEditor?.chain().focus().toggleBlockquote().run())}
              />
              <ToolbarButton
                icon={<Code2 className="h-4 w-4" />}
                label={actions.code}
                disabled={toolbarDisabled}
                onClick={() => applyBodyCommand(() => bodyEditor?.chain().focus().toggleCode().run())}
              />
              <ToolbarButton
                icon={<Link2 className="h-4 w-4" />}
                label={actions.link}
                disabled={toolbarDisabled}
                onClick={() => {
                  if (!bodyEditor) return
                  const previousUrl = bodyEditor.getAttributes("link").href as string | undefined
                  const nextUrl = window.prompt("https://", previousUrl || "https://")
                  if (!nextUrl) return
                  bodyEditor.chain().focus().extendMarkRange("link").setLink({ href: nextUrl }).run()
                }}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/15 p-4">
            <div className="flex flex-wrap gap-2">
              {availableTokens.length > 0 ? (
                availableTokens.map((token) => (
                  <button
                    key={token.token}
                    type="button"
                    onClick={() => insertToken(token)}
                    className="cursor-pointer"
                    title={token.description}
                  >
                    <DataTag tone={token.tone ?? "info"}>{token.label}</DataTag>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{emptyTokensLabel}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{subjectLabel}</label>
            <div
              className={cn(
                "rounded-lg border bg-background shadow-xs transition-[border-color,box-shadow]",
                activeField === "subject" ? "border-ring ring-ring/20 ring-[3px]" : "border-input",
              )}
            >
              <EditorContent editor={subjectEditor} />
              {!draftSubject.trim() ? (
                <div className="pointer-events-none -mt-10 px-3 py-2 text-sm text-muted-foreground">
                  {subjectPlaceholder}
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2">
            <label className="text-sm font-medium">{bodyLabel}</label>
            <div
              className={cn(
                "rounded-lg border bg-background shadow-xs transition-[border-color,box-shadow]",
                activeField === "body" ? "border-ring ring-ring/20 ring-[3px]" : "border-input",
              )}
            >
              <div className="max-h-[42vh] overflow-auto">
                <EditorContent editor={bodyEditor} />
                {!draftBody.trim() ? (
                  <div className="pointer-events-none -mt-[18rem] px-4 py-3 text-sm text-muted-foreground">
                    {bodyPlaceholder}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            {actions.cancel}
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            onClick={handleSave}
            disabled={isSaving || !draftSubject.trim() || !draftBody.trim()}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {actions.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ToolbarButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button type="button" variant="outline" size="sm" className="cursor-pointer" disabled={disabled} onClick={onClick}>
      {icon}
      {label}
    </Button>
  )
}
