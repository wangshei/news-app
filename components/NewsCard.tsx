import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import TrendChat from "./TrendChat"

interface NewsItem {
  id: number
  time: string
  title: string
  hasImage: boolean
}

interface NewsCardProps {
  item: NewsItem
  category: string
}

export default function NewsCard({ item, category }: NewsCardProps) {
  const [showChat, setShowChat] = useState(false)

  // Mock trend data based on the news item
  const mockTrend: any = {
    id: item.id.toString(),
    title: item.title,
    summary: `关于"${item.title}"的最新动态和分析`,
    description: `这是一个关于"${item.title}"的深入分析。该话题在当前${category}领域引起了广泛关注，涉及多个方面的讨论和影响。`,
    category: category,
    sources: [
      {
        id: "1",
        name: "权威媒体",
        quote: `关于"${item.title}"的详细报道和分析`,
        url: "https://example.com/source1",
      },
      {
        id: "2",
        name: "专业机构",
        quote: `"${item.title}"相关的研究报告和数据`,
        url: "https://example.com/source2",
      },
    ],
  }

  if (showChat) {
    return (
      <TrendChat 
        trend={mockTrend} 
        skipTopicSelection={true}
        onBack={() => setShowChat(false)}
        className="fixed inset-0 z-[9999] bg-[var(--surface)] overflow-y-auto w-screen h-screen max-w-none"
      />
    )
  }

  return (
    <Card 
      className="news-item hover:shadow-sm transition-shadow cursor-pointer hover:bg-[var(--surface-alt)]"
      onClick={() => setShowChat(true)}
    >
      <CardContent className="p-3 py-0">
        {item.hasImage && (
          <div className="h-20 bg-[var(--surface-alt)] rounded mb-3 flex items-center justify-center">
            {/* Image placeholder */}
          </div>
        )}
        <div className="text-left">
          <span className="text-sm font-medium text-[var(--text)]">{item.title}</span>
        </div>
      </CardContent>
    </Card>
  )
} 