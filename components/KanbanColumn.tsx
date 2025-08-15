import NewsCard from "./NewsCard"

interface NewsItem {
  id: number
  time: string
  title: string
  hasImage: boolean
}

interface KanbanColumnProps {
  category: string
  newsItems: NewsItem[]
}

export default function KanbanColumn({ category, newsItems }: KanbanColumnProps) {
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
      <h3 className="text-base font-medium text-foreground mb-4">{category}</h3>
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([time, items]) => (
          <div key={time} className="time-group">
            <div className="text-xs text-muted-foreground mb-2 font-medium">{time}</div>
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