"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, MessageCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategoryColor } from "@/utils/categoryColors"

interface Source {
  id: string
  name: string
  quote: string
  url: string
}

interface TrendDetail {
  id: string
  title: string
  summary: string
  description: string
  category: string
  sources: Source[]
}

interface ChatMessage {
  id: string
  role: "user" | "system"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [trendDetail, setTrendDetail] = useState<TrendDetail | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [expandedSource, setExpandedSource] = useState<string | null>(null)

  // Get topic ID from router query
  useEffect(() => {
    const topicId = searchParams.get('id') || searchParams.get('selected')
    
    if (topicId) {
      fetchTrendDetail(topicId)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const fetchTrendDetail = async (topicId: string) => {
    try {
      console.log('Fetching trend detail for topic:', topicId)
      const response = await fetch(`/api/daily/${topicId}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setTrendDetail(result.data)
          console.log('Trend detail loaded:', result.data)
        }
      } else {
        console.error('Failed to fetch trend detail')
      }
    } catch (error) {
      console.error('Error fetching trend detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionClick = async (question: string) => {
    if (!trendDetail) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])

    // POST to chat API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: trendDetail.id,
          question: question
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Add system reply
          const systemMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "system",
            content: result.data.reply,
            timestamp: new Date()
          }
          setChatMessages(prev => [...prev, systemMessage])
        }
      }
    } catch (error) {
      console.error('Error calling chat API:', error)
      
      // Add placeholder reply if API fails
      const systemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: "(AI 回答占位符…)",
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, systemMessage])
    }
  }

  const handleCustomQuestion = async () => {
    if (!inputValue.trim() || !trendDetail) return

    await handleQuestionClick(inputValue)
    setInputValue("")
  }

  const toggleSourceExpansion = (sourceId: string) => {
    setExpandedSource(expandedSource === sourceId ? null : sourceId)
  }

  // Suggested questions (hard-coded for now)
  const suggestedQuestions = [
    "这个趋势对普通民众有什么影响？",
    "未来几个月会如何发展？",
    "我们应该如何应对这个变化？"
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--surface-alt)] rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-[var(--surface-alt)] rounded"></div>
              <div className="h-32 bg-[var(--surface-alt)] rounded"></div>
              <div className="h-32 bg-[var(--surface-alt)] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!trendDetail) {
    return (
      <div className="min-h-screen bg-[var(--surface)] p-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回主页
          </Button>
          <div className="text-center text-[var(--text)]">
            <h1 className="text-2xl font-bold mb-4">无法加载话题详情</h1>
            <p>请返回主页重新选择话题</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] flex flex-col">
      {/* Back Button - Fixed at Top */}
      <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] p-4 z-40">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回主页
          </Button>
        </div>
      </div>

      {/* Scrollable Content - News Card + Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Topic Detail Card - Treated as Bot Response */}
          <div className="flex justify-start">
            <Card className="max-w-xs lg:max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-[var(--text)] leading-tight">
                    {trendDetail.title}
                  </CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(trendDetail.category)}`}>
                    {trendDetail.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <p className="text-sm text-[var(--text)] leading-relaxed">
                  {trendDetail.summary}
                </p>
                
                {/* Description */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {trendDetail.description}
                </p>
                
                {/* Sources */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[var(--text)]">相关来源：</h4>
                  
                  {/* Source Buttons - Horizontal Layout */}
                  <div className="flex flex-wrap gap-2">
                    {trendDetail.sources.map((source) => (
                      <Button
                        key={source.id}
                        variant="outline"
                        size="sm"
                        className={`h-6 px-2 text-xs ${
                          expandedSource === source.id 
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]' 
                            : 'bg-transparent hover:bg-[var(--surface-alt)]'
                        }`}
                        onClick={() => toggleSourceExpansion(source.id)}
                      >
                        {source.name}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Expanded Source Content */}
                  {expandedSource && (
                    <div className="mt-3 p-3 bg-[var(--surface-alt)] rounded border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-medium text-[var(--text)]">
                          {trendDetail.sources.find(s => s.id === expandedSource)?.name}
                        </h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1 text-xs"
                          onClick={() => window.open(trendDetail.sources.find(s => s.id === expandedSource)?.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          阅读原文
                        </Button>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        "{trendDetail.sources.find(s => s.id === expandedSource)?.quote}"
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggested Questions */}
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md">
              <h4 className="text-sm font-medium text-[var(--text)] mb-3">建议的问题：</h4>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2 px-3 text-xs w-full"
                    onClick={() => handleQuestionClick(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-[var(--primary-blue)] text-white'
                    : 'bg-[var(--surface-alt)] text-[var(--text)]'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 z-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入您的问题..."
              className="flex-1 border-0 shadow-none bg-transparent focus:ring-0 focus:border-0"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomQuestion()}
            />
            <Button 
              onClick={handleCustomQuestion} 
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
