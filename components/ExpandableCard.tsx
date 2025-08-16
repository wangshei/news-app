import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getCategoryColor } from "@/utils/categoryColors"

interface TrendResponse {
  title: string;
  subtitle: string;
  bullets: Array<{
    id: string;
    tagline: string;
  }>;
}

interface ExpandableCardProps {
  title: string
  cardContent?: React.ReactNode
}

export default function ExpandableCard({ title, cardContent }: ExpandableCardProps) {
  const router = useRouter()
  const [todaysTheme, setTodaysTheme] = useState<TrendResponse | null>(null)
  const [loading, setLoading] = useState(true)

    useEffect(() => {
    const fetchTrends = async () => {
      try {
        // Check if we have cached data from today
        const today = new Date().toDateString()
        const cachedData = localStorage.getItem('trendsCache')
        
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          if (parsed.date === today && parsed.data) {
            console.log('Using cached trends data from today')
            setTodaysTheme(parsed.data)
            setLoading(false)
            return
          }
        }
        
        console.log('Fetching fresh trends from /api/trend...')
        const response = await fetch('/api/trend')
        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('API result:', result)
        
        if (result.success && result.data) {
          console.log('Setting todaysTheme with:', result.data)
          setTodaysTheme(result.data)
          
          // Cache the data with today's date
          const cacheData = {
            date: today,
            data: result.data
          }
          localStorage.setItem('trendsCache', JSON.stringify(cacheData))
          console.log('Trends data cached for today')
        } else {
          console.error('API returned error:', result)
          throw new Error(result.error || 'Failed to fetch news data')
        }
      } catch (error) {
        console.error('Failed to fetch trends:', error)
        // Try to use cached data even if it's old
        const cachedData = localStorage.getItem('trendsCache')
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData)
            if (parsed.data) {
              console.log('Using cached trends data (may be old)')
              setTodaysTheme(parsed.data)
              setLoading(false)
              return
            }
          } catch (parseError) {
            console.error('Failed to parse cached data:', parseError)
          }
        }
        
        // Fallback to default data
        setTodaysTheme({
          title: "变动中的世界，视角决定答案",
          subtitle: "今日焦点：社会变革、芯片竞赛、全球货币新秩序",
          bullets: [
            { id: "society", tagline: "年轻人涌向\"三线城市\"" },
            { id: "tech", tagline: "国产 3nm AI 芯片面世" },
            { id: "economy", tagline: "数字人民币跨境试点扩容" }
          ]
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [])

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
            {/* Large Title */}
            <h1 className="text-3xl font-bold text-[var(--text)] leading-tight">
              {todaysTheme.title}
            </h1>
            
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
                      "economy": "经济"
                    }
                    
                    const displayName = categoryNames[bullet.id] || bullet.id
                    
                    return (
                      <li key={bullet.id} className="text-sm text-[var(--text)]">
                        • <span className={`${getCategoryColor(bullet.id)} font-medium`}> {displayName}: </span> {bullet.tagline}
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