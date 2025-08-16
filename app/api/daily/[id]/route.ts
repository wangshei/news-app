import { NextRequest, NextResponse } from "next/server";

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
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const topicId = params.id;
    console.log("Fetching daily topic details for ID:", topicId);

    // For now, return mock data based on the topic ID
    // This will be replaced with real data fetching logic
    const mockTrendDetails: { [key: string]: TrendDetail } = {
      "society": {
        id: "society",
        title: "全球气候罢工浪潮席卷多国",
        summary: "随着气候变化问题日益严重，全球多个城市爆发了大规模的气候罢工活动，要求政府采取更积极的减排政策。",
        description: "这是一个全球性的社会运动，反映了公众对气候变化问题的关注和担忧。从欧洲到亚洲，从学生到工人，不同群体都参与到这场运动中，要求政府和企业承担更多责任。",
        category: "社会",
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
        ]
      },
      "tech": {
        id: "tech",
        title: "OpenAI发布多模态GPT-5，颠覆人机交互模式",
        summary: "OpenAI最新发布的GPT-5模型支持文本、图像、音频等多种输入格式，标志着AI技术进入多模态时代。",
        description: "GPT-5的发布代表了人工智能技术的重要里程碑。该模型不仅能够处理传统的文本输入，还能理解图像内容、识别语音指令，并生成相应的回应。这种多模态能力将彻底改变人机交互的方式。",
        category: "科技",
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
        ]
      },
      "economy": {
        id: "economy",
        title: "美联储维持高利率，全球经济增长预期下调",
        summary: "美联储决定维持当前高利率水平，这一政策对全球金融市场产生重大影响，多国央行相应调整货币政策。",
        description: "美联储的利率政策对全球经济具有重要影响。高利率环境虽然有助于控制通胀，但也会抑制经济增长和投资活动。各国央行需要在这一背景下平衡通胀控制和经济增长的关系。",
        category: "经济",
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
        ]
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
    console.error("Error fetching daily topic details:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch topic details",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
