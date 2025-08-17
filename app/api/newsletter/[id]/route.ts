import { NextRequest, NextResponse } from "next/server";
import { FALLBACK_DATA } from "@/config/fallbackData";

interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
}

interface TrendDetail {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  sources: Array<{
    id: string;
    name: string;
    quote: string;
    url: string;
  }>;
  headlines: Headline[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const topicId = params.id;
    console.log("Fetching newsletter topic details for ID:", topicId);

    // TODO: replace with real data from newsletter API
    const mockTrendDetails: { [key: string]: TrendDetail } = {
      "society": {
        id: "society",
        title: FALLBACK_DATA.newsletter.trends[0].title,
        summary: FALLBACK_DATA.newsletter.trends[0].summary,
        description: FALLBACK_DATA.newsletter.trends[0].summary,
        category: FALLBACK_DATA.newsletter.trends[0].category,
        sources: [
          {
            id: "1",
            name: "路透社",
            quote: "全球超过100个城市同时举行气候罢工，参与人数创历史新高",
            url: "https://example.com/reuters-climate-strike"
          },
          {
            id: "2",
            name: "BBC中文",
            quote: "年轻一代成为气候运动的主力军，推动政策变革",
            url: "https://example.com/bbc-youth-climate"
          }
        ],
        headlines: FALLBACK_DATA.newsletter.trends[0].headlines
      },
      "tech": {
        id: "tech",
        title: FALLBACK_DATA.newsletter.trends[1].title,
        summary: FALLBACK_DATA.newsletter.trends[1].summary,
        description: FALLBACK_DATA.newsletter.trends[1].summary,
        category: FALLBACK_DATA.newsletter.trends[1].category,
        sources: [
          {
            id: "3",
            name: "TechCrunch",
            quote: "GPT-5的多模态能力将重塑AI应用生态，开启新的可能性",
            url: "https://example.com/techcrunch-gpt5"
          },
          {
            id: "4",
            name: "MIT Technology Review",
            quote: "多模态AI标志着从单一文本处理向全面感知的转变",
            url: "https://example.com/mit-multimodal-ai"
          }
        ],
        headlines: FALLBACK_DATA.newsletter.trends[1].headlines
      },
      "economy": {
        id: "economy",
        title: FALLBACK_DATA.newsletter.trends[2].title,
        summary: FALLBACK_DATA.newsletter.trends[2].summary,
        description: FALLBACK_DATA.newsletter.trends[2].summary,
        category: FALLBACK_DATA.newsletter.trends[2].category,
        sources: [
          {
            id: "5",
            name: "华尔街日报",
            quote: "美联储政策影响全球资金流向，新兴市场面临挑战",
            url: "https://example.com/wsj-fed-policy"
          },
          {
            id: "6",
            name: "金融时报",
            quote: "高利率环境将持续，企业融资成本上升",
            url: "https://example.com/ft-high-rates"
          }
        ],
        headlines: FALLBACK_DATA.newsletter.trends[2].headlines
      }
    };

    const trendDetail = mockTrendDetails[topicId];
    
    if (!trendDetail) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trendDetail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching newsletter topic details:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch topic details",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
