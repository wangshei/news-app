import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface NewsItem {
  id: number | string
  time: string
  title: string
  hasImage: boolean
  url?: string
}

interface NewsCardProps {
  item: NewsItem
  category: string
}

export default function NewsCard({ item, category }: NewsCardProps) {
  const router = useRouter()

  // Map category to API ID for the unified chat system
  const getCategoryId = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      "科技": "tech",
      "社会": "society", 
      "经济": "economy",
      "政治": "politics"
    }
    return categoryMap[category] || "society"
  }

  const handleCardClick = () => {
    // Navigate to the unified chat system with the headline ID
    console.log(`▶️ Kanban → ChatWindow id=${item.id}`)
    router.push(`/chat?id=${item.id}`)
  }

  return (
    <Card 
      className="news-item hover:shadow-sm transition-shadow cursor-pointer hover:bg-[var(--surface-alt)]"
      onClick={handleCardClick}
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