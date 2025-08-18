'use client'

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { getCategoryColor } from "@/utils/categoryColors"
import { useNewsletter } from "@/hooks/useNewsletter"
import { CATEGORIES } from "@/config/categories"

import TrendCard from "@/components/TrendCard"
import ChatWindow from "@/components/ChatWindow"



interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
}





interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  timestamp: Date;
  followUpQuestions?: string[]; // Added for follow-up questions
}

function ChatSessionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicIdx = parseInt(searchParams.get('topicIdx') || '0')
  
  const [currentIdx, setCurrentIdx] = useState(topicIdx)
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [newsletterExpanded, setNewsletterExpanded] = useState(false)
  const [suggest, setSuggest] = useState<string[]>([])
  const [isInitializing, setIsInitializing] = useState(false)
  const [expandedSource, setExpandedSource] = useState<string | null>(null)
  
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

  // Initialize AI-generated suggestions for the current trend
  const initializeTrendSuggestions = useCallback(async () => {
    if (!newsletter?.trends || currentIdx >= newsletter.trends.length) return
    
    const currentTrend = newsletter.trends[currentIdx]
    console.log("[INIT] Initializing suggestions for trend:", currentTrend.id)
    setIsInitializing(true)
    
    try {
      
      // Then, get the initial suggestions
      const suggestionsResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: currentTrend.id,
          mode: "trend", // Specify trend mode for newsletter trends
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
      // First, get the expert description
      const expertResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: currentTrend.id,
          mode: "trend", // Specify trend mode for newsletter trends
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
            timestamp: new Date(),
            followUpQuestions: expertResult.data?.nextQuestions || []
          }
          setHistory([expertMessage])
          console.log("[INIT] Expert description added:", expertResult.data.answer)
        }
      }
      
    } catch (error) {
      console.error('[INIT] Failed to initialize suggestions:', error)
      // Fall back to default suggestions
      setSuggest(["探索事件起源", "预测近期影响", "探讨未来走向"])
    } finally {
      setIsInitializing(false)
    }
  }, [newsletter, currentIdx])

  // Start with empty history for each topic - no more seedHistory
  useEffect(() => {
    if (newsletter?.trends && newsletter.trends.length > 0 && currentIdx < newsletter.trends.length) {
      setHistory([]) // Start with empty history for each topic
      setSuggest([]) // Reset suggestions
      setIsInitializing(false) // Reset initialization state
      
      // Initialize with AI-generated suggestions for the current trend
      initializeTrendSuggestions()
    }
  }, [newsletter, currentIdx, initializeTrendSuggestions])

    // Toggle source expansion
  const toggleSourceExpansion = (sourceId: string) => {
    setExpandedSource(expandedSource === sourceId ? null : sourceId)
  }

  // Auto-scroll is now handled by ChatWindow component

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
          mode: "trend", // Specify trend mode for newsletter trends
          question: question,
          history: history
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Update follow-up questions with dynamic ones from the API
        if (result.data?.nextQuestions && Array.isArray(result.data.nextQuestions)) {
          // Follow-up questions are now handled by ChatWindow component
          setSuggest(result.data.nextQuestions || [])
        } else {
          // No more questions available, clear suggestions
          setSuggest([])
        }
        
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          role: 'system',
          content: result.data?.answer || "抱歉，暂时无法回答。",
          timestamp: new Date(),
          followUpQuestions: result.data?.nextQuestions || []
        }
        setHistory(prev => [...prev, systemMessage])
        
        // Console logs for debugging
        console.log("[RECV answer]", result.data?.answer);
        console.log("[RECV next]", result.data?.nextQuestions);
        
        // Generate follow-up questions separately for better performance
        if (result.data?.nextQuestions && result.data.nextQuestions.length > 0) {
          // Hide follow-up questions initially
          // Follow-up questions display is now handled by ChatWindow component
          
                      // Follow-up questions display is now handled by ChatWindow component
        }
      } else {
        // Handle API error response
        const errorData = await response.json().catch(() => ({}))
        console.error('[CHAT] API error:', response.status, errorData)
        
        const errorMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          role: 'system',
          content: `抱歉，服务器返回错误 (${response.status})。请稍后再试。`,
          timestamp: new Date(),
          followUpQuestions: []
        }
        setHistory(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending question:', error)
      const errorMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: "抱歉，网络连接出现问题。请检查网络连接后重试。",
        timestamp: new Date(),
        followUpQuestions: []
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
      setSuggest([]) // Reset suggestions
      setIsInitializing(false) // Reset initialization state
    } else {
      // All topics completed
      const completionMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: "已讨论完毕，感谢！",
        timestamp: new Date(),
        followUpQuestions: []
      }
      setHistory(prev => [...prev, completionMessage])
    }
  }

  const handlePreviousTopic = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1)
      setHistory([]) // Clear history for new topic
      setSuggest([]) // Reset suggestions
      setIsInitializing(false) // Reset initialization state
    }
  }

  // Auto-scroll is now handled by ChatWindow component

  const handleBack = () => {
    router.push('/chat/select')
  }

  // Check if user can proceed to next topic
  // Show button when: user has had at least 1 Q&A exchange AND not currently loading
  const canProceedToNextTopic = history.length > 2 && !isLoadingResponse
  
  // Debug logging
  console.log("[DEBUG] Navigation state:", {
    historyLength: history.length,
    isLoading: isLoadingResponse,
    canProceed: canProceedToNextTopic,
    suggestLength: suggest.length
  })

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
              返回预览
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-[var(--background)] ${getCategoryColor(topic.category)}`}>
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
            <TrendCard 
              trend={currentTopic}
              expandedSource={expandedSource}
              onToggleSource={toggleSourceExpansion}
            />
          </div>

          {/* Suggested Questions - Right below the topic card */}
          <div className="flex justify-start">
            <div className="w-full max-w-3xl">
              <h4 className="text-sm font-medium text-[var(--text)] mb-3">板凳上的思考：</h4>
              <div className="space-y-2">
                {isInitializing ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)] mx-auto mb-2"></div>
                    <p className="text-sm text-[var(--text-secondary)]">正在生成智能问题...</p>
                  </div>
                ) : suggest.length > 0 ? (
                  suggest.map((question) => (
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

         

          {/* Chat Window */}
      <ChatWindow
        onSendMessage={sendQuestion}
        messages={history}
        isLoading={isLoadingResponse}
        canProceedToNextTopic={canProceedToNextTopic}
        onNextTopic={handleNextTopic}
        onPreviousTopic={currentIdx > 0 ? handlePreviousTopic : undefined}
        isLastTopic={isLastTopic}
      />
        </div>
      </div>
    </div>
  )
}

export default function ChatSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">加载中...</p>
        </div>
      </div>
    }>
      <ChatSessionPageContent />
    </Suspense>
  )
}
