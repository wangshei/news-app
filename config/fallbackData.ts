// Shared fallback data for when API calls fail or scraping is unavailable
export const FALLBACK_DATA = {
  // Default newsletter data
  newsletter: {
    title: "变动中的世界，视角决定答案",
    subtitle: "今日焦点：社会变革、芯片竞赛、全球货币新秩序",
    trends: [
      {
        id: "society",
        title: "年轻人涌向\"三线城市\"",
        summary: "年轻人涌向\"三线城市\"",
        category: "社会",
        headlines: [
          {
            id: "society-fallback",
            title: "Fallback headline for society",
            source: "Fallback Data",
            url: "https://example.com/society-fallback",
            timestamp: new Date().toISOString()
          }
        ]
      },
      {
        id: "tech",
        title: "国产 3nm AI 芯片面世",
        summary: "国产 3nm AI 芯片面世",
        category: "科技",
        headlines: [
          {
            id: "tech-fallback",
            title: "Fallback headline for tech",
            source: "Fallback Data",
            url: "https://example.com/tech-fallback",
            timestamp: new Date().toISOString()
          }
        ]
      },
      {
        id: "economy",
        title: "数字人民币跨境试点扩容",
        summary: "数字人民币跨境试点扩容",
        category: "经济",
        headlines: [
          {
            id: "economy-fallback",
            title: "Fallback headline for economy",
            source: "Fallback Data",
            url: "https://example.com/economy-fallback",
            timestamp: new Date().toISOString()
          }
        ]
      }
    ]
  },
  
  // Default trend data (for backward compatibility)
  trends: {
    title: "变动中的世界，视角决定答案",
    subtitle: "今日焦点：社会变革、芯片竞赛、全球货币新秩序",
    bullets: [
      { id: "society", tagline: "年轻人涌向\"三线城市\"" },
      { id: "tech", tagline: "国产 3nm AI 芯片面世" },
      { id: "economy", tagline: "数字人民币跨境试点扩容" }
    ]
  },
  
  // Default headlines data
  headlines: [
    { category: "society", title: "Fallback headline for society", url: "https://example.com/society-news" },
    { category: "tech", title: "Fallback headline for tech", url: "https://example.com/tech-news" },
    { category: "economy", title: "Fallback headline for economy", url: "https://example.com/economy-news" }
  ]
};
