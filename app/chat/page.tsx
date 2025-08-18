"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

import { ArrowLeft } from "lucide-react"


import { useHeadlines } from "@/hooks/useHeadlines"
import ChatLayout from "@/components/ChatLayout"
import HeadlineCard from "@/components/HeadlineCard"
import ChatWindow from "@/components/ChatWindow"






interface Headline {
  id: string
  title: string
  url: string
  source: string
  category: string
  timestamp: string
}

interface ChatMessage {
  id: string
  role: "user" | "system"
  content: string
  timestamp: Date
}

function ChatPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [headline, setHeadline] = useState<Headline | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(true)

  const [initialQuestions, setInitialQuestions] = useState<string[]>([])

  const [showFollowUpQuestions, setShowFollowUpQuestions] = useState(false)
  const [questionsGenerated, setQuestionsGenerated] = useState(false)
  const [headlineSummary, setHeadlineSummary] = useState<string>("")
  const [headlineDescription, setHeadlineDescription] = useState<string>("")
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const [isAnalyzingSource, setIsAnalyzingSource] = useState(false)
  
  // Use headlines hook for Kanban card navigation
  const { headlines: headlinesData, loading: headlinesLoading } = useHeadlines()
  


  // Get topic ID from router query
  useEffect(() => {
    const id = searchParams.get('id')
    
    if (!id) {
      console.log('[HEADLINE-CHAT] No ID provided, redirecting to home')
      router.replace('/')
      return
    }
    
    console.log('[HEADLINE-CHAT] id =', id)
    
    if (headlinesData) {
      // Flatten columns and find headline
      const headline = headlinesData.columns
        .flatMap(col => col.cards)
        .find(card => card.id === id)
      
      if (headline) {
        console.log('[HEADLINE-CHAT] id =', id, 'found?', true)
        setHeadline(headline)
        setLoading(false)
      } else {
        console.log('[HEADLINE-CHAT] id =', id, 'found?', false)
        setLoading(false)
      }
    }
  }, [searchParams, headlinesData, router])

  // Generate initial questions and analyze source when headline is loaded
  useEffect(() => {
    console.log('useEffect triggered:', { headline: headline?.title, questionsGenerated })
    if (headline) {
      if (!questionsGenerated) {
        console.log('Calling generateInitialQuestions')
        generateInitialQuestions()
      }
      
      // Always analyze source content for real-time description
      console.log('Calling analyzeSourceContent')
      analyzeSourceContent(headline)
    } else {
      console.log('Skipping functions - no headline available')
    }
  }, [headline]) // Remove questionsGenerated from dependencies

  const generateInitialQuestions = async () => {
    console.log('generateInitialQuestions called with:', { headline: headline?.title, questionsGenerated })
    if (!headline || questionsGenerated) {
      console.log('Skipping generation - headline:', !!headline, 'questionsGenerated:', questionsGenerated)
      return
    }
    
    console.log('Starting AI content generation')

    try {
      console.log('Making API call to /api/chat with:', {
        topicId: headline.id,
        headlineTitle: headline.title,
        headlineSource: headline.source,
        headlineCategory: headline.category
      })
      
      // Generate questions, summary, and description in one call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: headline.id,
          question: `请为这条新闻生成内容，必须严格按照以下JSON格式返回，不要添加任何其他文字：

新闻标题：${headline.title}
新闻来源：${headline.source}
新闻分类：${headline.category}

请生成：
1. 3个思考问题（每个10-20字，用中文简体）
2. 40字以内的新闻概要
3. 100字以内的详细描述

返回格式：
{
  "questions": ["问题1", "问题2", "问题3"],
  "summary": "概要内容",
  "description": "详细描述内容"
}`,
          history: []
        })
      })
      
      console.log('API response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Chat API response:', result)
        
        if (result.success && result.data && result.data.answer) {
          console.log('AI answer received:', result.data.answer)
          console.log('AI answer type:', typeof result.data.answer)
          console.log('AI answer length:', result.data.answer.length)
          
          try {
            // Try to parse the AI response as JSON
            const aiResponse = JSON.parse(result.data.answer)
            console.log('Parsed AI response:', aiResponse)
            
            if (aiResponse.questions && Array.isArray(aiResponse.questions)) {
              setInitialQuestions(aiResponse.questions)
              console.log('Set initial questions:', aiResponse.questions)
            }
            if (aiResponse.summary) {
              setHeadlineSummary(aiResponse.summary)
              console.log('Set headline summary:', aiResponse.summary)
            }
            if (aiResponse.description) {
              setHeadlineDescription(aiResponse.description)
              console.log('Set headline description:', aiResponse.description)
            }
            setQuestionsGenerated(true)
            console.log('AI content generated successfully')
          } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', parseError)
            console.error('Raw response was:', result.data.answer)
            // Fallback if parsing fails - try to extract questions from the text
            console.log('Trying to extract questions from text response')
            const textResponse = result.data.answer
            const extractedQuestions = extractQuestionsFromText(textResponse)
            if (extractedQuestions.length > 0) {
              setInitialQuestions(extractedQuestions)
              console.log('Extracted questions from text:', extractedQuestions)
            } else {
              setInitialQuestions([
                "这个新闻有什么影响？",
                "为什么会发生这样的事？",
                "未来会如何发展？"
              ])
            }
            // Set fallback summary only - description will be handled by analyzeSourceContent
            setHeadlineSummary("这是一条关于" + headline.category + "的新闻，涉及" + headline.source + "的报道")
            setQuestionsGenerated(true)
          }
        } else if (result.success && result.data && result.data.nextQuestions) {
          // Handle case where API returns nextQuestions directly
          console.log('API returned nextQuestions directly:', result.data.nextQuestions)
          if (Array.isArray(result.data.nextQuestions)) {
            setInitialQuestions(result.data.nextQuestions)
            setQuestionsGenerated(true)
            console.log('Set initial questions from nextQuestions')
          }
        } else {
          console.log('API response missing answer field:', result)
          // Fallback if API response is invalid
          setInitialQuestions([
            "这个新闻有什么影响？",
            "为什么会发生这样的事？",
            "未来会如何发展？"
          ])
          setHeadlineSummary("这是一条关于" + headline.category + "的新闻，涉及" + headline.source + "的报道")
          // Don't set fallback description here - let analyzeSourceContent handle it
          setQuestionsGenerated(true)
        }
      } else {
        console.error('API call failed with status:', response.status)
        // Fallback if API call fails
        setInitialQuestions([
          "这个新闻有什么影响？",
          "为什么会发生这样的事？",
          "未来会如何发展？"
        ])
        setHeadlineSummary("这是一条关于" + headline.category + "的新闻，涉及" + headline.source + "的报道")
        // Description will be handled by analyzeSourceContent
        setQuestionsGenerated(true)
      }
    } catch (error) {
      console.error('Error generating initial questions:', error)
      // Fallback questions if API fails
      setInitialQuestions([
        "这个新闻有什么影响？",
        "为什么会发生这样的事？",
        "未来会如何发展？"
      ])
      setHeadlineSummary("这是一条关于" + headline.category + "的新闻，涉及" + headline.source + "的报道")
      // Description will be handled by analyzeSourceContent
      setQuestionsGenerated(true)
    }
  }



  const handleQuestionClick = async (question: string) => {
    if (!headline) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setIsLoadingResponse(true)

    // POST to chat API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: headline.id,
          question: question
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Add system reply
          const systemMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "system",
            content: result.data.answer || result.data.reply || "抱歉，AI回答暂时不可用",
            timestamp: new Date()
          }
          setChatMessages(prev => [...prev, systemMessage])
          
          // Handle follow-up questions if they exist (only generate once)
          if (result.data.nextQuestions && Array.isArray(result.data.nextQuestions) && result.data.nextQuestions.length > 0 && !showFollowUpQuestions) {
    
            // Show follow-up questions after the second bot message (when we have 2+ messages)
            if (chatMessages.length >= 1) {
              setShowFollowUpQuestions(true)
            }
          }
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
    } finally {
      setIsLoadingResponse(false)
    }
  }

  const handleCustomQuestion = async () => {
    if (!inputValue.trim() || !headline) return

    const question = inputValue.trim()
    setInputValue("")
    await handleQuestionClick(question)
  }



    // Function to analyze source content and generate real-time description
  const analyzeSourceContent = async (headline: Headline) => {
    console.log('🚀 === ANALYZE SOURCE CONTENT START ===')
    console.log('📰 Headline Object:', JSON.stringify(headline, null, 2))
    console.log('🔗 URL to fetch:', headline.url)
    console.log('📅 Timestamp:', headline.timestamp)
    console.log('🏷️ Category:', headline.category)
    console.log('📡 Source:', headline.source)
    
    if (!headline.url) {
      console.log('❌ No URL available, skipping source analysis')
      return
    }
    
    setIsAnalyzingSource(true)
    console.log('⏳ Setting loading state, starting analysis...')
    
    // Track whether we successfully got AI description
    let aiDescriptionSet = false
    
    try {
      console.log('🌐 === STEP 1: FETCHING CONTENT FROM URL ===')
      console.log('🔗 Fetching from URL:', headline.url)
      
      // Use our backend API to avoid CORS issues
      console.log('📡 Making API call to /api/fetch-content...')
      const response = await fetch('/api/fetch-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: headline.url })
      })
      console.log('📡 API Response Status:', response.status)
      console.log('📡 API Response OK:', response.ok)
      
      if (response.ok) {
        console.log('✅ API request successful, parsing response...')
        const result = await response.json()
        console.log('📄 API Response:', JSON.stringify(result, null, 2))
        
        if (result.success && result.content) {
          const htmlContent = result.content
          console.log('📄 Content Length:', htmlContent.length)
          console.log('📄 Content Preview (first 300 chars):', htmlContent.substring(0, 300))
          
          console.log('🔍 === STEP 2: EXTRACTING TEXT CONTENT ===')
          
          // Content is already cleaned by the backend, but let's process it further
          const content = htmlContent;
          
          if (content.length > 100) {
            console.log('🤖 === STEP 3: CALLING AI WITH EXTRACTED CONTENT ===')
            console.log('📊 Content length check passed:', content.length, '> 100')
            
            // Use AI to synthesize description from actual content
            const aiPrompt = `基于以下新闻内容，生成一个100字以内的详细描述，要求：
1. 准确反映文章的核心内容
2. 语言简洁明了
3. 突出重要信息

新闻内容：
${content}

请严格按照以下JSON格式返回，不要添加任何其他文字：
{
  "questions": ["问题1", "问题2", "问题3"],
  "summary": "概要内容",
  "description": "详细描述内容"
}`
            
            console.log('📝 AI Prompt being sent:', aiPrompt)
            console.log('📡 Making API call to /api/chat...')
            
            const aiResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                topicId: headline.id,
                question: aiPrompt,
                history: []
              })
            })
            
            console.log('🤖 AI API Response Status:', aiResponse.status)
            console.log('🤖 AI API Response OK:', aiResponse.ok)
            
            if (aiResponse.ok) {
              console.log('✅ AI API call successful, parsing response...')
              const aiResult = await aiResponse.json()
              console.log('🤖 AI API Full Response:', JSON.stringify(aiResult, null, 2))
              
              if (aiResult.success && aiResult.data && aiResult.data.answer) {
                console.log('🎯 AI Answer Found:', aiResult.data.answer)
                
                try {
                  // Parse the AI response to extract the description
                  const aiResponseData = JSON.parse(aiResult.data.answer)
                  if (aiResponseData.description) {
                    console.log('📝 Extracted description from AI response:', aiResponseData.description)
                    console.log('📝 Description length:', aiResponseData.description.length)
                    setHeadlineDescription(aiResponseData.description)
                    aiDescriptionSet = true
                    console.log('✅ AI-generated description set successfully!')
                    console.log('✅ aiDescriptionSet flag set to:', aiDescriptionSet)
                  } else {
                    console.log('❌ AI response missing description field')
                    console.log('🔍 Available fields in AI response:', Object.keys(aiResponseData))
                  }
                } catch (parseError) {
                  console.error('❌ Failed to parse AI response as JSON:', parseError)
                  console.log('📝 Using raw AI response as description')
                  setHeadlineDescription(aiResult.data.answer)
                  aiDescriptionSet = true
                }
              } else {
                console.log('❌ AI API response missing answer field')
                console.log('🔍 Available fields:', Object.keys(aiResult.data || {}))
              }
            } else {
              console.error('❌ AI API failed with status:', aiResponse.status)
              const errorText = await aiResponse.text()
              console.error('❌ Error response body:', errorText)
            }
          } else {
            console.log('❌ Content too short for AI analysis:', content.length, '<= 100')
          }
        } else {
          console.log('❌ API response missing content field')
          console.log('🔍 API response details:', JSON.stringify(result, null, 2))
          
          // Try to use meta description if available
          if (result.metaDescription && result.metaDescription.length > 20) {
            console.log('📝 Using meta description as fallback:', result.metaDescription)
            setHeadlineDescription(result.metaDescription)
            aiDescriptionSet = true
          }
        }
      } else {
        console.error('❌ API call failed with status:', response.status)
        const errorText = await response.text()
        console.error('❌ Error response body:', errorText)
      }
    } catch (error) {
      console.error('❌ Error analyzing source content:', error)
    } finally {
      setIsAnalyzingSource(false)
      
      // If we failed to get AI description, set a better fallback
      if (!aiDescriptionSet) {
        console.log('🔄 === STEP 4: SETTING FALLBACK DESCRIPTION ===')
        console.log('❌ AI description generation failed, using fallback')
        const fallbackDescription = `这是一条来自 ${headline.source} 的新闻，报道了 ${headline.title} 的相关情况。发布时间：${new Date(headline.timestamp).toLocaleString()}`
        console.log('📝 Fallback description:', fallbackDescription)
        setHeadlineDescription(fallbackDescription)
      } else {
        console.log('✅ AI description was set successfully, no fallback needed')
      }
    }
  }

  // Helper function to extract questions from text response
  const extractQuestionsFromText = (text: string): string[] => {
    const questions: string[] = []
    
    // Look for question patterns in Chinese text
    const questionPatterns = [
      /[？?]\s*([^？?。！!]+)/g,
      /(?:问题|建议|思考|探讨)[：:]\s*([^。！!]+)/g,
      /(?:1[.、]|2[.、]|3[.、])\s*([^。！!]+)/g
    ]
    
    for (const pattern of questionPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const question = match.replace(/^[？?]\s*/, '').replace(/^(?:问题|建议|思考|探讨)[：:]\s*/, '').replace(/^(?:1[.、]|2[.、]|3[.、])\s*/, '').trim()
          if (question && question.length > 5 && question.length < 50) {
            questions.push(question)
          }
        })
      }
    }
    
    // If no patterns found, try to split by common separators
    if (questions.length === 0) {
      const sentences = text.split(/[。！!]/)
      sentences.forEach(sentence => {
        if (sentence.includes('？') || sentence.includes('?') || sentence.includes('问题') || sentence.includes('思考')) {
          const cleanSentence = sentence.trim()
          if (cleanSentence.length > 5 && cleanSentence.length < 50) {
            questions.push(cleanSentence)
          }
        }
      })
    }
    
    // Return unique questions, limit to 3
    return [...new Set(questions)].slice(0, 3)
  }

  if (loading || headlinesLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {headline ? (
          <ChatLayout 
            header={<HeadlineCard 
              headline={headline} 
              summary={headlineSummary}
              description={headlineDescription}
              isAnalyzingSource={isAnalyzingSource}
            />}
          >
            <div className="space-y-6">
              {/* Static Suggested Questions - 板凳上的思考 */}
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md">
                  <h4 className="text-sm font-medium text-[var(--text)] mb-3">板凳上的思考：</h4>
                  <div className="space-y-2">
                    {initialQuestions.length > 0 ? (
                      initialQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-2 px-3 text-xs w-full"
                          onClick={() => handleQuestionClick(question)}
                        >
                          {question}
                        </Button>
                      ))
                    ) : (
                      <div className="text-sm text-[var(--text-secondary)]">生成问题中...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Messages and Input - Use ChatWindow component */}
              <ChatWindow
                onSendMessage={handleCustomQuestion}
                messages={chatMessages}
                isLoading={isLoadingResponse}
                canProceedToNextTopic={false}
              />
            </div>
          </ChatLayout>
        ) : (
          <div className="p-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-[var(--text-secondary)] mb-4">这条新闻已过期或不存在，返回首页重新选择。</p>
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
              >
                返回首页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chat input is now handled by ChatWindow component */}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">加载中...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}
