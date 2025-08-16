import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, MessageCircle } from "lucide-react"
import { getCategoryColor } from "@/utils/categoryColors"

interface Source {
  id: string
  name: string
  quote: string
  url: string
}

interface TrendCardProps {
  id: string
  title: string
  summary: string
  description: string
  category: string
  sources: Source[]
  onStartChat: () => void
}

export default function TrendCard({
  id,
  title,
  summary,
  description,
  category,
  sources,
  onStartChat
}: TrendCardProps) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-[var(--text)] leading-tight">
            {title}
          </CardTitle>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
            {category}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {summary}
        </p>
        
        {/* Description */}
        <p className="text-sm text-[var(--text)] leading-relaxed">
          {description}
        </p>
        
        {/* Sources */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--text)]">相关来源：</h4>
          {sources.map((source) => (
            <div key={source.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text)]">
                  {source.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => window.open(source.url, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  阅读原文
                </Button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-2 border-l-2 border-[var(--border)]">
                "{source.quote}"
              </p>
            </div>
          ))}
        </div>
        
        {/* Action Button */}
        <Button
          onClick={onStartChat}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          开始讨论
        </Button>
      </CardContent>
    </Card>
  )
}
