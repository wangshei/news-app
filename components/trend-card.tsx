import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SourceTag } from "./source-tag"

interface Source {
  id: string
  name: string
  quote: string
  url: string
}

interface Trend {
  id: string
  title: string
  summary: string
  sources: Source[]
}

interface TrendCardProps {
  trend: Trend
}

export function TrendCard({ trend }: TrendCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{trend.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{trend.summary}</p>
        <div className="flex flex-wrap gap-2">
          {trend.sources.map((source) => (
            <SourceTag key={source.id} source={source} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
