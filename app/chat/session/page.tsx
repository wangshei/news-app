'use client'

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageCircle, RotateCcw, User, Bot, ChevronDown, ChevronUp, ArrowRight, ArrowLeftCircle, ArrowRightCircle } from "lucide-react"
import { getCategoryColor, getCategoryBackgroundColor } from "@/utils/categoryColors"

interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
}

interface TrendDetail {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  sources: Array<{
    id: string;
    name: string;
    quote: string;
    url: string;
  }>;
  headlines: Headline[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  timestamp: Date;
}

export default function ChatSessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicIdx = parseInt(searchParams.get('topicIdx') || '0')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [currentIdx, setCurrentIdx] = useState(topicIdx)
  const [topics, setTopics] = useState<TrendDetail[]>([])
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [newsletterExpanded, setNewsletterExpanded] = useState(false)

  const suggestedQuestions = ["探索事件起源", "预测近期影响", "探讨未来走向"]

  useEffect(() => {
    fetchTopics()
  }, [])

  useEffect(() => {
    if (topics.length > 0 && currentIdx < topics.length) {
      seedHistory()
    }
  }, [topics, currentIdx])

  useEffect(() => {
    scrollToBottom()
  }, [history])

  const fetchTopics = async () => {
    try {
      // Fetch all three topics
      const topicIds = ['society', 'tech', 'economy']
      const topicPromises = topicIds.map(id => 
        fetch(`/api/newsletter/${id}`).then(res => res.json())
      )
      
      const results = await Promise.all(topicPromises)
      const validTopics = results
        .filter(result => result.success)
        .map(result => result.data)
      
      setTopics(validTopics)
    } catch (error) {
      console.error('Error fetching topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const seedHistory = () => {
    if (topics.length === 0 || currentIdx >= topics.length) return
    
    const trend = topics[currentIdx]
    const newsletterTitle = "变动中的世界，视角决定答案"
    const newsletterSubtitle = "今日焦点：社会变革、芯片竞赛、全球货币新秩序"
    
    // No seeded history - we'll show newsletter context as a card
    setHistory([])
  }

  const sendQuestion = async (question: string) => {
    if (topics.length === 0 || currentIdx >= topics.length) return
    
    const trend = topics[currentIdx]
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    }
    
    setHistory(prev => [...prev, userMessage])
    setIsLoadingResponse(true)
    
    try {
      // TODO: replace chat placeholder with real Eko call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: trend.id,
          question: question,
          history: history
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          role: 'system',
          content: result.data?.answer || "(AI 回答占位符…)",
          timestamp: new Date()
        }
        setHistory(prev => [...prev, systemMessage])
      }
    } catch (error) {
      console.error('Error sending question:', error)
      const errorMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: "抱歉，处理您的问题时出现了错误。",
        timestamp: new Date()
      }
      setHistory(prev => [...prev, errorMessage])
    } finally {
      setIsLoadingResponse(false)
    }
  }

  const handleNextTopic = () => {
    if (currentIdx < topics.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setHistory([]) // Clear history for new topic
    } else {
      // All topics completed
      const completionMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: "已讨论完毕，感谢！",
        timestamp: new Date()
      }
      setHistory(prev => [...prev, completionMessage])
    }
  }

  const handlePreviousTopic = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1)
      setHistory([]) // Clear history for new topic
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleBack = () => {
    router.push('/chat/select')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">加载中...</p>
        </div>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)]">无法加载话题数据</p>
        </div>
      </div>
    )
  }

  const currentTopic = topics[currentIdx]
  const isLastTopic = currentIdx === topics.length - 1

  return (
    <div className="min-h-screen bg-[var(--surface)] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] p-4 z-40">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回选择
            </Button>
            <div className="text-sm text-[var(--text-secondary)]">
              话题 {currentIdx + 1} / {topics.length}: {currentTopic.category}
            </div>
          </div>
          
          {/* Collapsible Newsletter Section */}
          <div className="border border-[var(--border)] rounded-lg bg-[var(--surface-alt)]">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--surface)] transition-colors"
              onClick={() => setNewsletterExpanded(!newsletterExpanded)}
            >
              <div>
                <h3 className="font-medium text-[var(--text)]">变动中的世界，视角决定答案</h3>
                <p className="text-sm text-[var(--text-secondary)]">今日焦点：社会变革、芯片竞赛、全球货币新秩序</p>
              </div>
              {newsletterExpanded ? (
                <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
              )}
            </div>
            
            {newsletterExpanded && (
              <div className="border-t border-[var(--border)] p-4 space-y-3">
                {topics.map((topic) => (
                  <div key={topic.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-[var(--text)]">
                        {topic.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(topic.category)}`}>
                        {topic.category}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {topic.summary}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {topic.headlines.map((headline) => (
                        <span
                          key={headline.id}
                          className="rounded-sm bg-[var(--surface)] text-[var(--text)] px-2 py-1 text-xs"
                        >
                          {headline.source}: {headline.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Current Topic Info */}
          <div className="flex justify-start">
            <Card className={`w-full max-w-3xl ${getCategoryBackgroundColor(currentTopic.category)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-[var(--text)] leading-tight">
                    {currentTopic.title}
                  </CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(currentTopic.category)}`}>
                    {currentTopic.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[var(--text)] leading-relaxed">
                  {currentTopic.summary}
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {currentTopic.description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Suggested Questions - Right below the topic card */}
          <div className="flex justify-start">
            <div className="w-full max-w-3xl">
              <h4 className="text-sm font-medium text-[var(--text)] mb-3">建议的问题：</h4>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2 px-3 text-xs w-full"
                    onClick={() => sendQuestion(question)}
                    disabled={isLoadingResponse}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          {history.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end space-x-2`}
            >
              {message.role === 'system' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
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
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary-blue)] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoadingResponse && (
            <div className="flex justify-start items-end space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="w-full max-w-3xl px-4 py-2 rounded-lg bg-[var(--surface-alt)] text-[var(--text)]">
                <p className="text-sm">...</p>
              </div>
            </div>
          )}

          {/* Topic Navigation Buttons */}
          {history.length > 2 && !isLoadingResponse && (
            <div className="flex justify-center space-x-4">
              {/* Previous Topic Button - Show if not first topic */}
              {currentIdx > 0 && (
                <Button
                  onClick={handlePreviousTopic}
                  variant="outline"
                  className="px-6"
                >
                  <ArrowLeftCircle className="w-4 h-4 mr-2" />
                  上一话题
                </Button>
              )}
              
              {/* Next Topic Button */}
              <Button
                onClick={handleNextTopic}
                variant="outline"
                className="px-6"
              >
                <ArrowRightCircle className="w-4 h-4 mr-2" />
                {isLastTopic ? "结束对话" : "下一话题"}
              </Button>
            </div>
          )}
          
          {/* Scroll reference for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 z-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入您的问题..."
              className="flex-1 border-0 shadow-none bg-transparent focus:ring-0 focus:border-0"
              onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && sendQuestion(inputValue.trim())}
              disabled={isLoadingResponse}
            />
            <Button 
              onClick={() => inputValue.trim() && sendQuestion(inputValue.trim())}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
              disabled={!inputValue.trim() || isLoadingResponse}
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
