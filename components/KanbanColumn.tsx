import NewsCard from "./NewsCard"
import { getCategoryColor } from "@/utils/categoryColors"

interface NewsItem {
  id: number | string
  time: string
  title: string
  hasImage: boolean
}

interface KanbanColumnProps {
  category: string
  categoryId: string
  newsItems: NewsItem[]
}

export default function KanbanColumn({ category, categoryId, newsItems }: KanbanColumnProps) {
  const groupItemsByTime = (items: NewsItem[]) => {
    const grouped: { [key: string]: NewsItem[] } = {}
    items.forEach((item) => {
      if (!grouped[item.time]) {
        grouped[item.time] = []
      }
      grouped[item.time].push(item)
    })
    return grouped
  }

  const groupedItems = groupItemsByTime(newsItems)

  return (
    <div className="kanban-column">
      <h3 className="text-base font-medium text-[var(--text)] mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(categoryId)}`}>
          {category}
        </span>
      </h3>
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([time, items]) => (
          <div key={time} className="time-group">
            <div className="text-xs text-[var(--muted-text)] mb-2 font-medium">{time}</div>
            <div className="space-y-2">
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 