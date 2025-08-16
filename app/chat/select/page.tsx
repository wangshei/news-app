'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { getCategoryColor } from "@/utils/categoryColors"

interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
}

interface TrendBrief {
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
  briefs: TrendBrief[];
}

export default function TrendSelectionPage() {
  const router = useRouter()
  const [newsletter, setNewsletter] = useState<DailyNewsletter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNewsletter()
  }, [])

  const fetchNewsletter = async () => {
    try {
      const response = await fetch('/api/newsletter')
      if (!response.ok) {
        throw new Error('Failed to fetch newsletter')
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        setNewsletter(result.data)
      }
    } catch (error) {
      console.error('Error fetching newsletter:', error)
      // Fallback data
      setNewsletter({
        id: "daily-fallback",
        title: "变动中的世界，视角决定答案",
        subtitle: "今日焦点：社会变革、芯片竞赛、全球货币新秩序",
        date: new Date().toISOString().split('T')[0],
        briefs: [
          {
            id: 'society',
            title: '年轻人涌向"三线城市"',
            summary: '年轻人涌向"三线城市"',
            category: '社会',
            headlines: [
              {
                id: "soc-1",
                title: "一线城市房租上涨20%，年轻人压力倍增",
                source: "财经网",
                url: "https://example.com/soc-1",
                timestamp: "2024-01-15T10:00:00Z"
              }
            ]
          },
          {
            id: 'tech',
            title: '国产 3nm AI 芯片面世',
            summary: '国产 3nm AI 芯片面世',
            category: '科技',
            headlines: [
              {
                id: "tech-1",
                title: "华为发布麒麟9000S芯片，性能提升40%",
                source: "科技日报",
                url: "https://example.com/tech-1",
                timestamp: "2024-01-15T11:15:00Z"
              }
            ]
          },
          {
            id: 'economy',
            title: '数字人民币跨境试点扩容',
            summary: '数字人民币跨境试点扩容',
            category: '经济',
            headlines: [
              {
                id: "eco-1",
                title: "数字人民币在港试点，交易量突破1000万",
                source: "金融时报",
                url: "https://example.com/eco-1",
                timestamp: "2024-01-15T12:00:00Z"
              }
            ]
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTrendSelect = () => {
    // Pass the entire newsletter object via router state if easier
    router.push('/chat/session?topicIdx=0')
  }

  const handleBack = () => {
    router.push('/')
  }

  if (loading || !newsletter) {
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
              {newsletter.briefs.map((trend) => (
                <div key={trend.id} className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className={`px-2 rounded-full text-xs font-medium ${getCategoryColor(trend.category)} mt-1`}>
                      {trend.category}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--text)] mb-1">
                        {trend.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {trend.summary}
                      </p>
                    </div>
                  </div>
                  
                  {/* Headlines as Display Only */}
                  <div className="flex flex-wrap gap-2 ml-12">
                    {trend.headlines.map((headline) => (
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
