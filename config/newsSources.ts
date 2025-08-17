export const NEWS_SOURCES = {
  society: [
    { name: "BBC 中文网 社会", url: "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml", rss: true },
  ],
  tech: [
    { name: "钛媒体", url: "https://www.tmtpost.com/feed", rss: true },
  ],
  economy: [
    { name: "中国新闻网 财经频道",       url: "https://www.chinanews.com.cn/rss/finance.xml",     rss: true }
  ]
};


// TODO: User preferences could override these sources in the future
// Example: user could customize which sources to scrape or add their own news sources
