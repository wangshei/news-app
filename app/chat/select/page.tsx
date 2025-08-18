'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { getCategoryColor } from "@/utils/categoryColors"
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



export default function TopicSelectPage() {
  const router = useRouter()
  
  // Use the centralized newsletter hook
  const { newsletter, loading, error, status, cacheKey } = useNewsletter()
  
  // Runtime sanity check
  useEffect(() => {
    if (newsletter?.trends) {
      console.assert(
        newsletter.trends.length === CATEGORIES.length,
        "Newsletter trends mismatch"
      );
    }
  }, [newsletter]);



  const handleTrendSelect = () => {
    // Pass the entire newsletter object via router state if easier
    router.push('/chat/session?topicIdx=0')
  }

  const handleBack = () => {
    router.push('/')
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

  if (status === "building") {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">
            {cacheKey?.endsWith("AM") ? "早报生成中…" : "晚报生成中…"}
          </p>
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

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] p-4 z-40">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回主页
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-4">
            今日新闻主题
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            预览今日讨论主题，点击下方按钮开始深入对话
          </p>
        </div>

        {/* Today's Theme Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[var(--text)] text-center">
              今日焦点：{newsletter.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-[var(--text-secondary)] text-center mb-6">
              {newsletter.subtitle}
            </p>
            
            {/* Topics List with Headlines */}
            <div className="space-y-6 mb-8">
              {newsletter.trends.map((trend: Trend) => (
                <div key={trend.id} className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className={`px-2 rounded-full text-xs font-medium ${getCategoryColor(trend.category)} mt-1`}>
                      {trend.category}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-[var(--text)] mb-1">
                        {trend.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {trend.summary}
                      </p>
                    </div>
                  </div>
                  
                  {/* Headlines as Display Only */}
                  <div className="flex flex-wrap gap-2 ml-12">
                    {trend.headlines.map((headline: Headline) => (
                      <span
                        key={headline.id}
                        className="rounded-sm bg-[var(--surface-alt)] text-[var(--text)] px-3 py-1 text-xs"
                      >
                        {headline.source}: {headline.title}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Single Start Chat Button */}
            <div className="text-center">
              <Button
                onClick={handleTrendSelect}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 text-lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                开始今日讨论
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
