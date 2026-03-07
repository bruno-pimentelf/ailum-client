"use client"

import { MarkdownEditor } from "@/components/ui/markdown-editor"

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
}

export function PromptEditor({ value, onChange }: PromptEditorProps) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <MarkdownEditor
        value={value}
        onChange={onChange}
        placeholder='Descreva o comportamento: tom de voz, objetivos, condições para avançar o lead... Digite "/" para ver comandos'
        minHeight={280}
      />
    </div>
  )
}
