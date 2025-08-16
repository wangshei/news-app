import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "user" | "system"
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={cn("flex mb-4", role === "user" ? "justify-end" : "justify-start")}>
      <Card
        className={cn(
          "max-w-[80%] p-4",
          role === "user" ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-alt)] text-[var(--text)]",
        )}
      >
        <p className="text-sm">{content}</p>
      </Card>
    </div>
  )
}
