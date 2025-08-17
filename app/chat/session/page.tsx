'use client'

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageCircle, RotateCcw, User, Bot, ChevronDown, ChevronUp, ArrowRight, ArrowLeftCircle, ArrowRightCircle } from "lucide-react"
import { getCategoryColor, getCategoryBackgroundColor } from "@/utils/categoryColors"
import { useNewsletter } from "@/hooks/useNewsletter"
import { CATEGORIES } from "@/config/categories"

interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
}

interface Trend {
  id: string;
  title: string;
  summary: string;
  category: string;
  headlines: Headline[];
}

interface DailyNewsletter {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  trends: Trend[];
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
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [newsletterExpanded, setNewsletterExpanded] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([
    "探索事件起源", "预测近期影响", "探讨未来走向"
  ])
  const [suggest, setSuggest] = useState<string[]>([])
  const [isInitializing, setIsInitializing] = useState(false)
  
  // Use the centralized newsletter hook
  const { newsletter, loading, error } = useNewsletter()
  
  // Runtime sanity check
  useEffect(() => {
    if (newsletter?.trends) {
      console.assert(
        newsletter.trends.length === CATEGORIES.length,
        "Newsletter trends mismatch"
      );
    }
  }, [newsletter]);

  // Start with empty history for each topic - no more seedHistory
  useEffect(() => {
    if (newsletter?.trends && newsletter.trends.length > 0 && currentIdx < newsletter.trends.length) {
      setHistory([]) // Start with empty history for each topic
      setFollowUpQuestions(["探索事件起源", "预测近期影响", "探讨未来走向"]) // Reset to default questions
      setSuggest([]) // Reset suggestions
      setIsInitializing(false) // Reset initialization state
      
      // Initialize with AI-generated suggestions for the current trend
      initializeTrendSuggestions()
    }
  }, [newsletter, currentIdx])

  // Initialize AI-generated suggestions for the current trend
  const initializeTrendSuggestions = async () => {
    if (!newsletter?.trends || currentIdx >= newsletter.trends.length) return
    
    const currentTrend = newsletter.trends[currentIdx]
    console.log("[INIT] Initializing suggestions for trend:", currentTrend.id)
    setIsInitializing(true)
    
    try {
      // First, get the expert description
      const expertResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: currentTrend.id,
          question: "请以专家视角总结这个趋势的背景、现状和重要性",
          history: [],
          init: true
        })
      })
      
      if (expertResponse.ok) {
        const expertResult = await expertResponse.json()
        if (expertResult.data?.answer) {
          // Add expert system message to history
          const expertMessage: ChatMessage = {
            id: `expert-${Date.now()}`,
            role: 'system',
            content: expertResult.data.answer,
            timestamp: new Date()
          }
          setHistory([expertMessage])
          console.log("[INIT] Expert description added:", expertResult.data.answer)
        }
      }
      
      // Then, get the initial suggestions
      const suggestionsResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: currentTrend.id,
          question: "", // Empty question for initialization
          history: [],
          init: true // Flag to indicate initialization
        })
      })
      
      if (suggestionsResponse.ok) {
        const suggestionsResult = await suggestionsResponse.json()
        if (suggestionsResult.data?.nextQuestions && Array.isArray(suggestionsResult.data.nextQuestions)) {
          setSuggest(suggestionsResult.data.nextQuestions)
          console.log("[INIT] Generated suggestions:", suggestionsResult.data.nextQuestions)
        }
      }
    } catch (error) {
      console.error('[INIT] Failed to initialize suggestions:', error)
      // Fall back to default suggestions
      setSuggest(["探索事件起源", "预测近期影响", "探讨未来走向"])
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [history])

  const sendQuestion = async (question: string) => {
    if (!newsletter?.trends || newsletter.trends.length === 0 || currentIdx >= newsletter.trends.length) return
    
    const trend = newsletter.trends[currentIdx]
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    }
    
    setHistory(prev => [...prev, userMessage])
    setIsLoadingResponse(true)
    
    // Console log for debugging
    console.log("[SEND]", question);
    
    try {
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
        
        // Update follow-up questions with dynamic ones from the API
        if (result.data?.nextQuestions && Array.isArray(result.data.nextQuestions)) {
          setFollowUpQuestions(result.data.nextQuestions)
          setSuggest(result.data.nextQuestions || [])
        }
        
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          role: 'system',
          content: result.data?.answer || "抱歉，暂时无法回答。",
          timestamp: new Date()
        }
        setHistory(prev => [...prev, systemMessage])
        
        // Console logs for debugging
        console.log("[RECV answer]", result.data?.answer);
        console.log("[RECV next]", result.data?.nextQuestions);
      } else {
        // Handle API error response
        const errorData = await response.json().catch(() => ({}))
        console.error('[CHAT] API error:', response.status, errorData)
        
        const errorMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          role: 'system',
          content: `抱歉，服务器返回错误 (${response.status})。请稍后再试。`,
          timestamp: new Date()
        }
        setHistory(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending question:', error)
      const errorMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: "抱歉，网络连接出现问题。请检查网络连接后重试。",
        timestamp: new Date()
      }
      setHistory(prev => [...prev, errorMessage])
    } finally {
      setIsLoadingResponse(false)
    }
  }

  const handleNextTopic = () => {
    if (!newsletter?.trends) return
    
    if (currentIdx < newsletter.trends.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setHistory([]) // Clear history for new topic
      setFollowUpQuestions(["探索事件起源", "预测近期影响", "探讨未来走向"]) // Reset questions
      setSuggest([]) // Reset suggestions
      setIsInitializing(false) // Reset initialization state
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
      setFollowUpQuestions(["探索事件起源", "预测近期影响", "探讨未来走向"]) // Reset questions
      setSuggest([]) // Reset suggestions
      setIsInitializing(false) // Reset initialization state
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleBack = () => {
    router.push('/chat/select')
  }

  // Check if user can proceed to next topic
  const canProceedToNextTopic = history.length > 2 && !isLoadingResponse && suggest.length === 0

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

  if (error || !newsletter?.trends) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)]">无法加载话题数据</p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>
    )
  }

  const currentTopic = newsletter.trends[currentIdx]
  const isLastTopic = currentIdx === newsletter.trends.length - 1

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
              话题 {currentIdx + 1} / {newsletter.trends.length}: {currentTopic.category}
            </div>
          </div>
          
          {/* Collapsible Newsletter Section */}
          <div className="border border-[var(--border)] rounded-lg bg-[var(--surface-alt)]">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--surface)] transition-colors"
              onClick={() => setNewsletterExpanded(!newsletterExpanded)}
            >
              <div>
                <h3 className="font-medium text-[var(--text)]">{newsletter.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{newsletter.subtitle}</p>
              </div>
              {newsletterExpanded ? (
                <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
              )}
            </div>
            
            {newsletterExpanded && (
              <div className="border-t border-[var(--border)] p-4 space-y-3">
                {newsletter.trends.map((topic) => (
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
              </CardContent>
            </Card>
          </div>

          {/* Suggested Questions - Right below the topic card */}
          <div className="flex justify-start">
            <div className="w-full max-w-3xl">
              <h4 className="text-sm font-medium text-[var(--text)] mb-3">建议的问题：</h4>
              <div className="space-y-2">
                {isInitializing ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)] mx-auto mb-2"></div>
                    <p className="text-sm text-[var(--text-secondary)]">正在生成智能问题...</p>
                  </div>
                ) : suggest.length > 0 ? (
                  suggest.map((question, index) => (
                    <Button
                      key={question}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-2 px-3 text-xs w-full"
                      onClick={() => sendQuestion(question)}
                      disabled={isLoadingResponse}
                    >
                      {question}
                    </Button>
                  ))
                ) : (
                  <div className="text-center py-4 text-[var(--text-secondary)]">
                    <p className="text-sm">暂无建议问题</p>
                  </div>
                )}
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
                <p className="text-sm">思考中...</p>
              </div>
            </div>
          )}

          {/* Topic Navigation Buttons */}
          {canProceedToNextTopic && (
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
