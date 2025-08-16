"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, MoreHorizontal } from "lucide-react"
import TrendChat from "@/components/TrendChat"

// TypeScript interfaces for all data structures
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

// 真实的中国新闻数据
const trendOptions: Trend[] = [
  {
    id: "1",
    title: "年轻人涌向\"三线城市\"",
    summary:
      "随着一线城市生活成本攀升，越来越多年轻人选择在\"三线城市\"安家立业，带动当地消费升级和产业转型。",
    description: "这是一个长期的社会趋势，反映了中国城市化进程中的新变化。随着一线城市房价和生活成本持续攀升，越来越多的年轻人开始重新评估自己的居住选择。三线城市不仅提供了相对可负担的住房，还往往拥有更好的生活质量和更慢的生活节奏。这种趋势正在重塑中国的城市发展格局，为三线城市带来新的发展机遇。",
    category: "社会",
    sources: [
      {
        id: "1",
        name: "第一财经",
        quote: "三线城市房价相对稳定，年轻人购房压力较小，生活质量反而更高",
        url: "https://example.com/cbn-report",
      },
      {
        id: "2",
        name: "澎湃新闻",
        quote: "远程办公普及让年轻人不再被地理位置束缚，三线城市迎来人才回流潮",
        url: "https://example.com/thepaper-article",
      },
    ],
  },
  {
    id: "2",
    title: "国产 3nm AI 芯片面世",
    summary:
      "寒武纪发布\"灵犀 C5\"系列 3nm AI 芯片，性能/功耗比较上一代提升 2.6 倍，意在打破高端算力进口依赖。",
    description: "这是中国半导体产业的重要里程碑，标志着国产AI芯片在制程工艺上达到了世界先进水平。3nm制程技术是目前最先进的芯片制造工艺，能够显著提升芯片性能和降低功耗。寒武纪作为中国AI芯片的领军企业，此次突破不仅展示了中国在半导体技术上的进步，也为国内AI产业的发展提供了强有力的支撑。这一成果将有助于减少对国外高端芯片的依赖，提升国家科技竞争力。",
    category: "科技",
    sources: [
      {
        id: "3",
        name: "36氪",
        quote: "灵犀 C5 采用 Chiplet 架构，每瓦 TOPS 领先业界 30%",
        url: "https://example.com/36kr-report",
      },
      {
        id: "4",
        name: "IEEE Spectrum",
        quote: "国产 3nm 制程将缩小与台积电在 AI 芯片制造上的差距",
        url: "https://example.com/ieee-article",
      },
    ],
  },
  {
    id: "3",
    title: "数字人民币跨境试点扩容",
    summary:
      "数字人民币跨境支付试点范围进一步扩大，覆盖更多国家和地区，推动人民币国际化进程。",
    description: "数字人民币是中国央行数字货币的重要实践，代表了货币形态的未来发展方向。跨境试点的扩容不仅体现了中国在数字货币领域的领先地位，也为人民币国际化开辟了新的路径。通过数字人民币，跨境支付可以更加便捷、安全、高效，同时降低交易成本。这一趋势将重塑全球金融格局，推动建立更加公平、包容的国际货币体系。中国在这一领域的探索和实践，为其他国家提供了宝贵的经验和参考。",
    category: "经济",
    sources: [
      {
        id: "5",
        name: "财新网",
        quote: "数字人民币在跨境贸易中的应用，将显著降低交易成本和提高效率",
        url: "https://example.com/caixin-article",
      },
      {
        id: "6",
        name: "路透社",
        quote: "中国数字人民币试点已覆盖 26 个国家和地区，跨境支付网络日趋完善",
        url: "https://example.com/reuters-report",
      },
    ],
  },
]

const initialQuestions: Question[] = [
  { id: "1", text: "这个趋势面临哪些主要挑战？" },
  { id: "2", text: "未来5年将如何影响社会？" },
  { id: "3", text: "有哪些潜在风险和收益？" },
]

export default function ChatPage() {
  const [selectedTrends, setSelectedTrends] = useState<Trend[]>([...trendOptions])
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0)
  const [messages, setMessages] = useState<Array<{ role: "user" | "system"; content: string }>>([
    { role: "system", content: "🤖 欢迎！请选择下方任一趋势展开对话。" }
  ])
  const [questionOptions, setQuestionOptions] = useState(initialQuestions)
  const [convoEnded, setConvoEnded] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [trendsSelected, setTrendsSelected] = useState(false)
  const router = useRouter()

  const handleTrendSelect = (trend: Trend) => {
    setSelectedTrends([trend])
    setCurrentTopicIndex(0)
    setTrendsSelected(true)
    
    // Add user selection message
    const userMessage = { role: "user" as const, content: `✅ ${trend.title}` }
    setMessages([userMessage])
  }

  const handleChangeTopic = (index: number) => {
    // Generate a new random topic for the given index
    const newTopic = {
      ...trendOptions[Math.floor(Math.random() * trendOptions.length)],
      id: Date.now().toString() + index
    }
    
    const newSelectedTrends = [...selectedTrends]
    newSelectedTrends[index] = newTopic
    setSelectedTrends(newSelectedTrends)
  }

  const handleStartDiscussion = () => {
    setTrendsSelected(true)
    const userMessage = { role: "user" as const, content: `✅ ${selectedTrends[0].title}` }
    setMessages([userMessage])
  }

  const handleNextTopic = () => {
    if (currentTopicIndex < selectedTrends.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1)
      const userMessage = { role: "user" as const, content: `✅ ${selectedTrends[currentTopicIndex + 1].title}` }
      setMessages(prev => [...prev, userMessage])
    }
  }

  const handleMoreTopics = () => {
    // Add 2 more random topics
    const newTopics = Array.from({ length: 2 }, (_, i) => ({
      ...trendOptions[Math.floor(Math.random() * trendOptions.length)],
      id: Date.now().toString() + (selectedTrends.length + i)
    }))
    setSelectedTrends([...selectedTrends, ...newTopics])
  }

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

  const handleEndConversation = () => {
    router.push("/")
  }

  // If a trend is selected, show the TrendChat component
  if (trendsSelected && selectedTrends.length > 0) {
    return (
      <TrendChat 
        trend={selectedTrends[currentTopicIndex]} 
        skipTopicSelection={true}
        onBack={() => {
          setTrendsSelected(false)
          setCurrentTopicIndex(0)
          setMessages([{ role: "system", content: "🤖 欢迎！请选择下方任一趋势展开对话。" }])
        }}
        onNextTopic={currentTopicIndex < selectedTrends.length - 1 ? handleNextTopic : undefined}
        isLastTopic={currentTopicIndex === selectedTrends.length - 1}
      />
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[var(--text)] hover:bg-[var(--surface-alt)]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回主页
        </Button>
      </div>

      {/* Catch-phrase card */}
      <div className="mb-8 p-6 bg-[var(--surface)] rounded-lg text-center">
        <h1 className="text-4xl font-bold mb-2">
          变动中的世界，视角决定答案
        </h1>
        <p className="text-lg text-[var(--text)]/70">
          今日焦点：社会变革、芯片竞赛、全球货币新秩序
        </p>
      </div>

      {/* Step 0: Trend Selection */}
      {!trendsSelected && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-left">今日推荐话题：</h3>
          <div className="flex flex-col gap-4">
            {selectedTrends.map((trend, index) => {
              const categoryColor = trend.category === "社会" ? "text-[var(--category-red-primary)]" :
                                   trend.category === "科技" ? "text-[var(--category-blue-primary)]" :
                                   "text-[var(--category-green-primary)]"
              return (
                <div
                  key={trend.id}
                  className="h-auto p-4 bg-transparent w-full border border-[var(--surface-alt)] rounded-lg"
                >
                  <div className="w-full text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold break-words">{trend.title}</div>
                        <span className={`text-xs font-medium ${categoryColor}`}>{trend.category}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleChangeTopic(index)}
                        className="p-1 h-8 w-8 hover:bg-[var(--surface-alt)]"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm break-words leading-relaxed text-[var(--muted-text)]">{trend.summary}</div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              onClick={handleStartDiscussion}
              className="flex-1 py-3 text-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
            >
              开始讨论
            </Button>
            <Button
              onClick={handleMoreTopics}
              variant="outline"
              className="flex-1 py-3 text-lg bg-transparent border-2 hover:bg-[var(--surface-alt)]"
            >
              更多话题
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
