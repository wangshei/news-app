"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Send, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

// TypeScript interfaces
interface Source {
  id: string
  name: string
  quote: string
  url: string
}

interface Trend {
  id: string
  title: string
  summary: string
  description: string
  category: string
  sources: Source[]
}

interface Question {
  id: string
  text: string
}

// Define category colors function
const getCategoryColor = (category: string) => {
  switch (category) {
    case "社会":
      return "text-[var(--category-red-primary)]"
    case "科技":
      return "text-[var(--category-blue-primary)]"
    case "经济":
      return "text-[var(--category-green-primary)]"
    default:
      return "text-[var(--accent)]"
  }
}

// Inline SourceTag component with expandable content
function SourceTag({ source, isExpanded, onToggle }: { source: Source; isExpanded: boolean; onToggle: () => void }) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={`rounded-full ${isExpanded ? 'bg-[var(--accent)] text-white' : 'bg-transparent'}`}
      onClick={onToggle}
    >
      {source.name}
    </Button>
  )
}

// Inline TrendCard component
function TrendCard({ trend }: { trend: Trend }) {
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null)

  const handleSourceToggle = (sourceId: string) => {
    setExpandedSourceId(expandedSourceId === sourceId ? null : sourceId)
  }

  const expandedSource = expandedSourceId ? trend.sources.find(s => s.id === expandedSourceId) : null

  const categoryColor = getCategoryColor(trend.category)

  return (
    <Card className="mb-6">
      <CardHeader >
        <div className="flex items-center gap-3 mb-2">
          <CardTitle className="text-2xl font-semibold break-words text-left">{trend.title}</CardTitle>
          <span className={`text-sm font-medium ${categoryColor}`}>{trend.category}</span>
        </div>
        <p className="text-md leading-relaxed break-words text-left text-[var(--muted-text)]">{trend.summary}</p>
      </CardHeader>
      <CardContent>
        <p className="text-[var(--text)] text-sm leading-relaxed mb-4 break-words text-left">{trend.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {trend.sources.map((source) => (
            <SourceTag 
              key={source.id} 
              source={source} 
              isExpanded={expandedSourceId === source.id}
              onToggle={() => handleSourceToggle(source.id)}
            />
          ))}
        </div>
        {/* Consistent expanded content area */}
        {expandedSource && (
          <div className="mb-3">
            <p className="text-sm mb-2 text-[var(--muted-text)]">"{expandedSource.quote}"</p>
            <a
              href={expandedSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              阅读原文 <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Inline ChatMessage component
function ChatMessage({ role, content }: { role: "user" | "system"; content: string }) {
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

// Inline SuggestionButtons component
function SuggestionButtons({
  questions,
  onQuestionClick,
}: { questions: Question[]; onQuestionClick: (question: string) => void }) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      {questions.map((question) => (
        <Button
          key={question.id}
          variant="outline"
          className="justify-start text-left h-auto p-4 whitespace-normal bg-transparent"
          onClick={() => onQuestionClick(question.text)}
        >
          {question.text}
        </Button>
      ))}
    </div>
  )
}

interface TrendChatProps {
  trend: Trend
  skipTopicSelection?: boolean
  onBack?: () => void
  className?: string
  onNextTopic?: () => void
  isLastTopic?: boolean
}

export default function TrendChat({ trend, skipTopicSelection = false, onBack, className, onNextTopic, isLastTopic }: TrendChatProps) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "system"; content: string }>>([
    { role: "system", content: "🤖 欢迎！请选择下方任一趋势展开对话。" }
  ])
  const [questionOptions, setQuestionOptions] = useState<Question[]>([
    { id: "1", text: "这个趋势面临哪些主要挑战？" },
    { id: "2", text: "未来5年将如何影响社会？" },
    { id: "3", text: "有哪些潜在风险和收益？" },
  ])
  const [inputValue, setInputValue] = useState("")

  // If skipTopicSelection is true, start with a user selection message
  useEffect(() => {
    if (skipTopicSelection) {
      const userMessage = { role: "user" as const, content: `✅ ${trend.title}` }
      setMessages([userMessage])
    }
  }, [skipTopicSelection, trend.title])

  const handleQuestionClick = (question: string) => {
    const userMessage = { role: "user" as const, content: question }
    const systemMessage = {
      role: "system" as const,
      content:
        "该芯片采用 Chiplet 架构，功耗比提升 2.6×。\n\n参考来源：\n• 36氪\n• IEEE Spectrum\n\n想进一步了解什么？\n1️⃣ 对能源消耗有何影响？\n2️⃣ 哪些初创公司最受益？\n3️⃣ 监管前景如何？",
    }

    setMessages((prev) => [...prev, userMessage, systemMessage])

    // Generate new question options
    const newQuestions: Question[] = [
      { id: Date.now().toString(), text: "能详细说明这一点吗？" },
      { id: (Date.now() + 1).toString(), text: "这有什么影响？" },
      { id: (Date.now() + 2).toString(), text: "与其他方案相比如何？" },
    ]
    setQuestionOptions(newQuestions)
  }

  const handleCustomQuestion = () => {
    if (!inputValue.trim()) return

    const userMessage = { role: "user" as const, content: inputValue }
    const systemMessage = {
      role: "system" as const,
      content:
        "以下三家初创公司或将直接受益：\n• 云智算 — 专注低功耗推理服务器\n• 芯聚成 — 提供 Chiplet 封装解决方案\n• 数见 — AI 终端推理卡制造商",
    }

    setMessages((prev) => [...prev, userMessage, systemMessage])
    setInputValue("")

    // Generate new question options
    const newQuestions: Question[] = [
      { id: Date.now().toString(), text: "告诉我更多关于这个话题的信息" },
      { id: (Date.now() + 1).toString(), text: "最新发展如何？" },
      { id: (Date.now() + 2).toString(), text: "如何了解更多？" },
    ]
    setQuestionOptions(newQuestions)
  }

  return (
    <div className={cn("min-h-screen p-6", className)}>
      {/* Back button */}
      {onBack && (
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--text)] hover:bg-[var(--surface-alt)]"
          >
            ← 返回
          </Button>
        </div>
      )}

      {/* Trend Detail Card */}
      <TrendCard trend={trend} />

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="mb-6">
          {messages.map((message, index) => (
            <ChatMessage key={index} role={message.role} content={message.content} />
          ))}
        </div>
      )}

      {/* Question Suggestions */}
      <SuggestionButtons questions={questionOptions} onQuestionClick={handleQuestionClick} />

      {/* Custom Input */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="提出你的问题..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleCustomQuestion()}
          className="flex-1"
        />
        <Button onClick={handleCustomQuestion} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Next Topic or End Conversation Button */}
      {onNextTopic && (
        <div className="flex justify-center mt-8 mb-8">
          <Button
            onClick={onNextTopic}
            variant="outline"
            className="px-8 py-3 text-lg bg-transparent border-2 hover:bg-[var(--surface-alt)]"
          >
            {isLastTopic ? "结束对话" : "下一个话题"}
          </Button>
        </div>
      )}
    </div>
  )
}
