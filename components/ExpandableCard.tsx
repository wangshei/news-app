import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface ExpandableCardProps {
  title: string
  cardContent?: React.ReactNode
}

export default function ExpandableCard({ title, cardContent }: ExpandableCardProps) {
  const router = useRouter()

  // Today's theme data
  const todaysTheme = {
    title: "变动中的世界，视角决定答案",
    tagline: "今日焦点：社会变革、芯片竞赛、全球货币新秩序",
    topics: [
      "年轻人涌向\"三线城市\"",
      "国产 3nm AI 芯片面世",
      "数字人民币跨境试点扩容"
    ]
  }

  return (
    <>
      <Card
        className="discovery-card cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => router.push('/chat')}
      >
        <CardContent className="p-6">
          <div className="text-left space-y-4">
            {/* Large Title */}
            <h1 className="text-3xl font-bold text-[var(--text)] leading-tight">
              {todaysTheme.title}
            </h1>
            
            {/* Tagline */}
            <p className="text-md text-[var(--muted-text)]">
              {todaysTheme.tagline}
            </p>
            
            {/* 3 Topic Bullet Points */}
            <div className="space-y-2">
              <ul className="space-y-2">
                {todaysTheme.topics.map((topic, index) => {
                  const category = ["社会", "科技", "经济"][index]
                  const categoryColor = category === "社会" ? "text-[var(--category-red-primary)]" :
                                       category === "科技" ? "text-[var(--category-blue-primary)]" :
                                       "text-[var(--category-green-primary)]"
                  return (
                    <li key={index} className="text-sm text-[var(--text)]">
                      • <span className={`${categoryColor} font-medium`}> {category}: </span> {topic}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 