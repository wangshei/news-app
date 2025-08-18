export const NEWS_SOURCES = {
  society: [
    { name: "中国新闻网-社会", url: "https://www.chinanews.com.cn/rss/society.xml", rss: true },
  ],
  tech: [
    { name: "钛媒体", url: "https://www.tmtpost.com/feed", rss: true },
  ],
  economy: [
    { name: "中国新闻网-财经频道",       url: "https://www.chinanews.com.cn/rss/finance.xml",     rss: true }
  ],

  politics: [
    { name: "中央社-政治", url: "https://feeds.feedburner.com/rsscna/politics", rss: true }
  ],
  
  world: [
    { name: "中国新闻网-国际频道", url: "https://www.chinanews.com.cn/rss/world.xml", rss: true },
    { name: "联合早报-即时国际", url: "https://plink.anyfeeder.com/zaobao/realtime/world", rss: true }
  ],
  
  culture: [
    { name: "CNA-文化", url: "https://feeds.feedburner.com/rsscna/culture", rss: true }
  ],
  
  life: [
    { name: "中国新闻网-生活频道", url: "https://www.chinanews.com.cn/rss/life.xml", rss: true },
    { name: "CNA-生活健康", url: "https://feeds.feedburner.com/rsscna/lifehealth", rss: true }
  ],
  
  sports: [
    { name: "中国新闻网-体育频道", url: "https://www.chinanews.com.cn/rss/sports.xml", rss: true }
  ]
};


// TODO: User preferences could override these sources in the future
// Example: user could customize which sources to scrape or add their own news sources
