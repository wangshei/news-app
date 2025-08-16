import { NextRequest, NextResponse } from "next/server";

interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
}

interface TrendBrief {
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
  briefs: TrendBrief[];
}

export async function GET(req: NextRequest) {
  try {
    console.log("Newsletter API called");
    
    // TODO: replace headlines mock with BrowserAgent scraping
    const newsletter: DailyNewsletter = {
      id: "daily-" + new Date().toISOString().split('T')[0],
      title: "变动中的世界，视角决定答案",
      subtitle: "今日焦点：社会变革、芯片竞赛、全球货币新秩序",
      date: new Date().toISOString().split('T')[0],
      briefs: [
        {
          id: 'society',
          title: '年轻人涌向"三线城市"',
          summary: '年轻人涌向"三线城市"',
          category: '社会',
          headlines: [
            {
              id: "soc-1",
              title: "一线城市房租上涨20%，年轻人压力倍增",
              source: "财经网",
              url: "https://example.com/soc-1",
              timestamp: "2024-01-15T10:00:00Z"
            },
            {
              id: "soc-2", 
              title: "三线城市人才政策优惠力度加大",
              source: "人民网",
              url: "https://example.com/soc-2",
              timestamp: "2024-01-15T10:30:00Z"
            }
          ]
        },
        {
          id: 'tech',
          title: '国产 3nm AI 芯片面世',
          summary: '国产 3nm AI 芯片面世',
          category: '科技',
          headlines: [
            {
              id: "tech-1",
              title: "华为发布麒麟9000S芯片，性能提升40%",
              source: "科技日报",
              url: "https://example.com/tech-1",
              timestamp: "2024-01-15T11:15:00Z"
            },
            {
              id: "tech-2",
              title: "中芯国际3nm工艺突破技术瓶颈",
              source: "半导体观察",
              url: "https://example.com/tech-2", 
              timestamp: "2024-01-15T11:45:00Z"
            }
          ]
        },
        {
          id: 'economy',
          title: '数字人民币跨境试点扩容',
          summary: '数字人民币跨境试点扩容',
          category: '经济',
          headlines: [
            {
              id: "eco-1",
              title: "数字人民币在港试点，交易量突破1000万",
              source: "金融时报",
              url: "https://example.com/eco-1",
              timestamp: "2024-01-15T12:00:00Z"
            },
            {
              id: "eco-2",
              title: "新加坡加入数字人民币跨境支付网络",
              source: "经济参考报",
              url: "https://example.com/eco-2",
              timestamp: "2024-01-15T12:30:00Z"
            }
          ]
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: newsletter,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching newsletter:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch newsletter data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
