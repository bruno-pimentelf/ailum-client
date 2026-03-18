"use client"

import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import CharacterCount from "@tiptap/extension-character-count"
import { Extension } from "@tiptap/react"
import { PluginKey, Plugin } from "prosemirror-state"
import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TextBolderIcon,
  TextItalic,
  Code,
  ListBullets,
  ListNumbers,
  Quotes,
  TextHOne,
  TextHTwo,
  TextHThree,
  Minus,
  ArrowCounterClockwise,
  ArrowClockwise,
} from "@phosphor-icons/react"

// ─── Slash command items ──────────────────────────────────────────────────────

interface CommandItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (editor: Editor) => void
}

function getSlashCommands(editor: Editor): CommandItem[] {
  return [
    {
      title: "Texto",
      description: "Parágrafo normal",
      icon: <span className="text-[13px]">¶</span>,
      command: (e) => e.chain().focus().setParagraph().run(),
    },
    {
      title: "Título 1",
      description: "Título grande",
      icon: <TextHOne className="h-3.5 w-3.5" />,
      command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Título 2",
      description: "Título médio",
      icon: <TextHTwo className="h-3.5 w-3.5" />,
      command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Título 3",
      description: "Título pequeno",
      icon: <TextHThree className="h-3.5 w-3.5" />,
      command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Lista",
      description: "Lista com marcadores",
      icon: <ListBullets className="h-3.5 w-3.5" />,
      command: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Lista numerada",
      description: "Lista ordenada",
      icon: <ListNumbers className="h-3.5 w-3.5" />,
      command: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Citação",
      description: "Bloco de citação",
      icon: <Quotes className="h-3.5 w-3.5" />,
      command: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Código",
      description: "Bloco de código",
      icon: <Code className="h-3.5 w-3.5" />,
      command: (e) => e.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Divisor",
      description: "Linha horizontal",
      icon: <Minus className="h-3.5 w-3.5" />,
      command: (e) => e.chain().focus().setHorizontalRule().run(),
    },
  ]
}

// ─── Slash command popup ──────────────────────────────────────────────────────

function SlashMenu({
  items,
  selectedIndex,
  onSelect,
}: {
  items: CommandItem[]
  selectedIndex: number
  onSelect: (item: CommandItem) => void
}) {
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.12, ease: [0.33, 1, 0.68, 1] }}
      className="w-64 rounded-xl border border-white/[0.10] bg-[oklch(0.16_0.02_263)] shadow-2xl shadow-black/70 py-1.5 max-h-72 overflow-y-auto"
    >
      <p className="px-3 py-1 text-[9px] font-bold text-white/85 uppercase tracking-wider">Comandos</p>
      {items.map((item, i) => (
        <button
          key={item.title}
          ref={i === selectedIndex ? activeRef : undefined}
          onClick={() => onSelect(item)}
          className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors duration-100 ${
            i === selectedIndex ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"
          }`}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-white/85">
            {item.icon}
          </div>
          <div>
            <p className="text-[12px] font-bold text-white/85">{item.title}</p>
            <p className="text-[10px] text-white/85">{item.description}</p>
          </div>
        </button>
      ))}
    </motion.div>
  )
}

// ─── Slash command extension ──────────────────────────────────────────────────

type SlashState = { open: boolean; query: string; from: number; pos: { top: number; left: number } | null }

function createSlashExtension(onSlashChange: (s: SlashState) => void) {
  let lastKey = ""
  const CLOSED: SlashState = { open: false, query: "", from: -1, pos: null }

  return Extension.create({
    name: "slashCommand",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("slashCommand"),
          props: {
            handleKeyDown: (view, event) => {
              if (event.key === "Escape") {
                lastKey = ""
                requestAnimationFrame(() => onSlashChange(CLOSED))
                return false
              }
              return false
            },
          },
          view: () => ({
            update: (view) => {
              const { state } = view
              const { selection } = state
              let next: SlashState
              if (selection.empty) {
                const { $from } = selection
                const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
                const slashIdx = textBefore.lastIndexOf("/")
                if (slashIdx !== -1) {
                  const query = textBefore.slice(slashIdx + 1)
                  const coords = view.coordsAtPos($from.pos)
                  const editorEl = view.dom.closest("[data-slash-container]") as HTMLElement | null
                  const containerRect = editorEl?.getBoundingClientRect() ?? { top: 0, left: 0 }
                  next = {
                    open: true,
                    query,
                    from: $from.pos - query.length - 1,
                    pos: { top: coords.bottom - containerRect.top + 4, left: coords.left - containerRect.left },
                  }
                } else {
                  next = CLOSED
                }
              } else {
                next = CLOSED
              }
              const key = JSON.stringify(next)
              if (key === lastKey) return
              lastKey = key
              requestAnimationFrame(() => onSlashChange(next))
            },
            destroy: () => {},
          }),
        }),
      ]
    },
  })
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (
    label: string,
    icon: React.ReactNode,
    action: () => void,
    isActive: boolean
  ) => (
    <button
      key={label}
      title={label}
      onMouseDown={(e) => {
        e.preventDefault()
        action()
      }}
      className={`cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-100 ${
        isActive
          ? "bg-white/[0.14] text-white"
          : "text-white/90 hover:bg-white/[0.08] hover:text-white/90"
      }`}
    >
      {icon}
    </button>
  )

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/[0.06] flex-wrap">
      {btn("Negrito", <TextBolderIcon className="h-3.5 w-3.5" />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {btn("Itálico", <TextItalic className="h-3.5 w-3.5" />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {btn("Código inline", <Code className="h-3.5 w-3.5" />, () => editor.chain().focus().toggleCode().run(), editor.isActive("code"))}
      <div className="h-4 w-px bg-white/[0.08] mx-1" />
      {btn("Título 1", <TextHOne className="h-3.5 w-3.5" />, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 }))}
      {btn("Título 2", <TextHTwo className="h-3.5 w-3.5" />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
      {btn("Título 3", <TextHThree className="h-3.5 w-3.5" />, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
      <div className="h-4 w-px bg-white/[0.08] mx-1" />
      {btn("Lista", <ListBullets className="h-3.5 w-3.5" />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {btn("Lista numerada", <ListNumbers className="h-3.5 w-3.5" />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {btn("Citação", <Quotes className="h-3.5 w-3.5" />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
      {btn("Bloco de código", <Code className="h-3.5 w-3.5" weight="bold" />, () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
      <div className="h-4 w-px bg-white/[0.08] mx-1" />
      {btn("Desfazer", <ArrowCounterClockwise className="h-3.5 w-3.5" />, () => editor.chain().focus().undo().run(), false)}
      {btn("Refazer", <ArrowClockwise className="h-3.5 w-3.5" />, () => editor.chain().focus().redo().run(), false)}
    </div>
  )
}

// ─── Main MarkdownEditor ──────────────────────────────────────────────────────

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = 220, className }: MarkdownEditorProps) {
  const [slashState, setSlashState] = useState<{
    open: boolean
    query: string
    from: number
    pos: { top: number; left: number } | null
  }>({ open: false, query: "", from: -1, pos: null })
  const [slashIdx, setSlashIdx] = useState(0)

  const slashExtension = useRef(createSlashExtension(setSlashState))

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { languageClassPrefix: "language-" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Descreva o agente... ou digite "/" para ver comandos',
      }),
      Typography,
      CharacterCount.configure({ limit: 4000 }),
      slashExtension.current,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getText() ? editor.getHTML() : "")
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
    immediatelyRender: false,
  })

  // Sync value changes from outside
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value && value !== editor.getHTML()) {
      // Only update if coming from outside (e.g. template load)
      if (!editor.isFocused) {
        editor.commands.setContent(value || "")
      }
    }
  }, [value, editor])

  const slashCommands = editor ? getSlashCommands(editor) : []
  const filteredCommands = slashState.query
    ? slashCommands.filter((c) =>
        c.title.toLowerCase().includes(slashState.query.toLowerCase())
      )
    : slashCommands

  const executeSlashCommand = useCallback(
    (item: CommandItem) => {
      if (!editor) return
      // Delete the slash + query text
      const { from } = slashState
      if (from >= 0) {
        editor
          .chain()
          .focus()
          .deleteRange({ from, to: from + slashState.query.length + 1 })
          .run()
      }
      item.command(editor)
      setSlashState({ open: false, query: "", from: -1, pos: null })
    },
    [editor, slashState]
  )

  // Arrow key navigation in slash menu
  useEffect(() => {
    if (!slashState.open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSlashIdx((i) => Math.min(i + 1, filteredCommands.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSlashIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredCommands[slashIdx]) executeSlashCommand(filteredCommands[slashIdx])
      } else if (e.key === "Escape") {
        setSlashState({ open: false, query: "", from: -1, pos: null })
      }
    }
    window.addEventListener("keydown", handleKey, true)
    return () => window.removeEventListener("keydown", handleKey, true)
  }, [slashState.open, slashIdx, filteredCommands, executeSlashCommand])

  // Reset slash index when results change
  useEffect(() => {
    setSlashIdx(0)
  }, [slashState.query])

  const charCount = editor?.storage.characterCount?.characters?.() ?? 0

  return (
    <div className={`relative flex flex-col rounded-xl border border-white/[0.10] bg-white/[0.03] overflow-hidden focus-within:border-white/[0.20] focus-within:ring-1 focus-within:ring-accent/30 transition-all duration-200 flex-1 min-h-0 ${className ?? ""}`}>
      {editor && <Toolbar editor={editor} />}

      <div
        data-slash-container
        className="relative flex-1"
        style={{ minHeight }}
      >
        <EditorContent
          editor={editor}
          className="notion-editor h-full px-4 py-3"
          style={{ minHeight }}
        />

        {/* Slash menu */}
        <AnimatePresence>
          {slashState.open && filteredCommands.length > 0 && slashState.pos && (
            <div
              className="absolute z-50"
              style={{ top: slashState.pos.top, left: slashState.pos.left }}
            >
              <SlashMenu
                items={filteredCommands}
                selectedIndex={slashIdx}
                onSelect={executeSlashCommand}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer: hint + char count */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06]">
        <p className="text-[10px] text-white/90">
          Digite <kbd className="rounded px-1 py-0.5 border border-white/[0.12] bg-white/[0.04] text-white/85 font-mono text-[9px]">/</kbd> para ver comandos
        </p>
        <span className="text-[10px] text-white/90 tabular-nums">{charCount} / 4000</span>
      </div>
    </div>
  )
}
