import { Card, CardContent } from "@/components/ui/card"

interface NewsItem {
  id: number
  time: string
  title: string
  hasImage: boolean
}

interface NewsCardProps {
  item: NewsItem
}

export default function NewsCard({ item }: NewsCardProps) {
  return (
    <Card className="news-item hover:shadow-sm transition-shadow">
      <CardContent className="p-3 py-0">
        {item.hasImage && (
          <div className="h-20 bg-muted/50 rounded mb-3 flex items-center justify-center">
            {/* Image placeholder */}
          </div>
        )}
        <div className="text-left">
          <span className="text-sm font-medium text-foreground">{item.title}</span>
        </div>
      </CardContent>
    </Card>
  )
} 