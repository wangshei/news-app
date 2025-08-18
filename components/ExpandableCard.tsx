import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getCategoryTextColor } from "@/utils/categoryColors"
import { FALLBACK_DATA } from "@/config/fallbackData"

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

interface DailyNewsletter {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  trends: Trend[];
}

interface TrendResponse {
  title: string;
  subtitle: string;
  bullets: Array<{
    id: string;
    label: string; // Add label field for category name
    tagline: string;
  }>;
}

interface ExpandableCardProps {
  title: string
  cardContent?: React.ReactNode
  newsletter?: DailyNewsletter | null
  cacheKey?: string | null
}

export default function ExpandableCard({ newsletter, cacheKey }: Omit<ExpandableCardProps, 'title' | 'cardContent'>) {
  const router = useRouter()
  const [todaysTheme, setTodaysTheme] = useState<TrendResponse | null>(null)
  const [loading, setLoading] = useState(true)

    useEffect(() => {
    if (newsletter) {
      // Use newsletter prop if available
      const transformedTheme = {
        title: newsletter.title,
        subtitle: newsletter.subtitle,
        bullets: newsletter.trends.map(trend => ({
          id: trend.id,
          label: trend.category, // Include the Chinese category label
          tagline: trend.title
        }))
      };
      setTodaysTheme(transformedTheme);
      setLoading(false);
    } else {
      // Fallback to default data if no newsletter
      setTodaysTheme(FALLBACK_DATA.trends);
      setLoading(false);
    }
  }, [newsletter])

  if (loading) {
    return (
      <Card className="discovery-card">
        <CardContent className="p-6">
          <div className="text-left space-y-4">
            <div className="animate-pulse">
              <div className="h-8 bg-[var(--surface-alt)] rounded mb-4"></div>
              <div className="h-6 bg-[var(--surface-alt)] rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-[var(--surface-alt)] rounded"></div>
                <div className="h-4 bg-[var(--surface-alt)] rounded"></div>
                <div className="h-4 bg-[var(--surface-alt)] rounded"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!todaysTheme) {
    return null
  }

  return (
    <>
      <Card
        className="discovery-card cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push('/chat/select')}
      >
        <CardContent className="p-6">
          <div className="text-left space-y-4">
            {/* Large Title with AM/PM Badge */}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[var(--text)] leading-tight">
                {todaysTheme.title}
              </h1>
              {cacheKey && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  cacheKey.endsWith("AM") 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-orange-100 text-orange-800"
                }`}>
                  {cacheKey.endsWith("AM") ? "早报" : "晚报"}
                </span>
              )}
            </div>
            
            {/* Tagline */}
            <p className="text-md text-[var(--muted-text)]">
              {todaysTheme.subtitle}
            </p>
            
            {/* 3 Topic Bullet Points */}
            <div className="space-y-2">
              <ul className="space-y-2">
                {todaysTheme.bullets && todaysTheme.bullets.length > 0 ? (
                  todaysTheme.bullets.map((bullet) => {
                    // Map English IDs to Chinese names for display
                    const categoryNames: { [key: string]: string } = {
                      "society": "社会",
                      "tech": "科技", 
                      "economy": "经济",
                      "politics": "政治",
                      "world": "国际",
                      "culture": "文化",
                      "sports": "体育",
                      "life": "生活"
                    }
                    
                    const displayName = categoryNames[bullet.id] || bullet.id
                    
                    return (
                      <li key={bullet.id} className="text-sm text-[var(--text)]">
                        • <span className={`${getCategoryTextColor(bullet.id)} font-medium`}> {displayName}: </span> {bullet.tagline}
                      </li>
                    )
                  })
                ) : (
                  <li className="text-sm text-[var(--muted-text)]">加载中...</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 