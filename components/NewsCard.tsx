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



  const handleCardClick = () => {
    // Navigate to the unified chat system with the headline ID
    console.log(`[KANBAN] navigating to`, item.id)
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