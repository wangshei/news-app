// This endpoint builds and caches the daily newsletter from RSS feeds and HTML sources, with DeepSeek summarization.
import { NextRequest, NextResponse } from "next/server";
import { CATEGORIES } from "@/config/categories";
import { NEWS_SOURCES } from "@/config/newsSources";
import { FALLBACK_DATA } from "@/config/fallbackData";
import OpenAI from "openai";
import * as cheerio from 'cheerio';



// In-memory cache for twice-daily newsletter (AM/PM windows)
const cache: Record<string, DailyNewsletter> = {};

// Timeout constants
const PER_SOURCE_TIMEOUT_MS = 8_000;   // 8 seconds per source
const ROUTE_TIMEOUT_MS = 25_000;       // 25 seconds total route timeout (increased from 15s)
const RECENT_MS = 24 * 60 * 60 * 1000; // 12 hours for recency filter (relaxed from 4h)

interface NewsSource {
  name: string;
  url: string;
  rss?: boolean;
  selector?: string;
}

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
  description?: string; // Optional expanded description
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

export async function GET(req: NextRequest) {
  try {
    console.log("Newsletter API called");
    
    // Check if API key is configured
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY not configured");
      return NextResponse.json(
        { error: "DEEPSEEK_API_KEY environment variable not configured" },
        { status: 500 }
      );
    }
    
    // Check cache first with AM/PM window
    const now = new Date();
    const yyyyMMdd = (d: Date) => d.toISOString().slice(0,10);
    const window = now.getHours() < 12 ? "AM" : "PM";
    const cacheKey = `${yyyyMMdd(now)}-${window}`;
    
    if (cache[cacheKey] && !req.nextUrl.searchParams.get("force")) {
      console.log("[NEWSLETTER] cache hit", cacheKey);
      return NextResponse.json(cache[cacheKey]);
    }
    
    console.log("[NEWSLETTER] building fresh newsletter for:", cacheKey);
    
    // Initialize OpenAI for DeepSeek
    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
      defaultHeaders: {
        "Content-Type": "application/json",
      },
    });
    
    // Timeout wrapper for individual source fetching
    async function fetchWithTimeout(promise: Promise<any>, sourceName: string) {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`TIMEOUT ${sourceName}`)), PER_SOURCE_TIMEOUT_MS)
        )
      ]);
    }
    
    // Main newsletter building function
    async function buildNewsletter() {
      const trends: Trend[] = [];
      
      // Process each category
      for (const category of CATEGORIES) {
        console.log(`Processing category: ${category}`);
        
        const categoryHeadlines: Headline[] = [];
        const sources: NewsSource[] = NEWS_SOURCES[category as keyof typeof NEWS_SOURCES] || [];
        
        // Fetch headlines from each source in the category
        for (const source of sources) {
          try {
            console.log(`Fetching from ${source.name}: ${source.url}`);
            
            let headlines: Headline[] = [];
            
            if (source.rss) {
              // Fetch RSS feed
              try {
                headlines = await fetchWithTimeout(fetchRSSHeadlines(source, category), source.name);
                console.log(`[NEWSLETTER] OK ${source.name} - ${headlines.length} headlines`);
              } catch (rssError) {
                console.warn(`[NEWSLETTER] FAIL ${source.name}:`, rssError instanceof Error ? rssError.message : String(rssError));
                continue;
              }
            } else {
              // Fetch HTML and parse with Cheerio
              try {
                headlines = await fetchWithTimeout(fetchHTMLHeadlines(source, category), source.name);
                console.log(`[NEWSLETTER] OK ${source.name} - ${headlines.length} headlines`);
              } catch (htmlError) {
                console.warn(`[NEWSLETTER] FAIL ${source.name}:`, htmlError instanceof Error ? htmlError.message : String(htmlError));
                continue;
              }
            }
            
            // Filter headlines by timestamp (keep only items published ≤12 hours ago)
            const twelveHoursAgo = new Date(Date.now() - RECENT_MS);
            const recentHeadlines = headlines.filter(h => {
              const headlineTime = new Date(h.timestamp);
              return headlineTime >= twelveHoursAgo;
            });
            
            categoryHeadlines.push(...recentHeadlines);
            
          } catch (sourceError) {
            console.warn(`[NEWSLETTER] FAIL ${source.name}:`, sourceError instanceof Error ? sourceError.message : String(sourceError));
            continue;
          }
        }
        
        // Deduplicate and score headlines
        const processedHeadlines = processHeadlines(categoryHeadlines);
        
        // If deduplication returns empty, keep up to 5 original headlines
        const finalHeadlines = processedHeadlines.length > 0 ? processedHeadlines : categoryHeadlines.slice(0, 5);
        
        // Generate trend summary for this category using DeepSeek
        let categoryTitle = "";
        let categorySummary = "";
        let categoryDescription = "";
        
        try {
          const titles = finalHeadlines.slice(0, 5).map(h => h.title).join('\n');
          const summaryPrompt = `以下是${category}领域最新头条：\n${titles}\n你是一位具有宏观视野和行业洞察力的财经科技评论员，请从下列最新头条中判断
1) 最核心的未来信号（Signal)——能预示中长期走向的关键变化；
2) 推动该信号出现的主要驱动因素；
3) 该信号可能带来的机会或风险。
提炼出以下信息：
1. 一句signal中文简体标题（20字以内）
2. 40字简体中文概要说明
3. 100字左右的详细说明分析，包括1-2个信号，2-3个驱动因素，2-3个未来机会/风险,用 Markdown 格式输出答案，适当加粗关键词、分段、使用列表等，让内容更易读

返回JSON格式：
{
  "title": "标题",
  "summary": "概要",
  "description": "详细说明"
}`;

          const summaryResult = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "user", content: summaryPrompt }],
            max_tokens: 300,
            temperature: 0.7,
            top_p: 0.9
          });
          
          const summaryContent = summaryResult.choices[0]?.message?.content;
          if (summaryContent) {
            // Clean and parse summary
            let cleanContent = summaryContent.trim();
            if (cleanContent.startsWith('```json')) {
              cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }
            if (cleanContent.startsWith('```')) {
              cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            try {
              const parsed = JSON.parse(cleanContent);
              categoryTitle = parsed.title;
              categorySummary = parsed.summary;
              categoryDescription = parsed.description;
              
              console.log(`✅ Successfully generated summary for ${category}:`, { title: categoryTitle, summary: categorySummary, description: categoryDescription });
            } catch (parseError) {
              console.error(`Failed to parse summary for ${category}:`, parseError);
              throw new Error(`Failed to parse summary for ${category}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            }
          }
                  } catch (summaryError) {
            console.error(`Failed to generate summary for ${category}:`, summaryError);
            throw new Error(`Failed to generate summary for ${category}: ${summaryError instanceof Error ? summaryError.message : String(summaryError)}`);
          }
        
        // Add category trend
        trends.push({
          id: category,
          title: categoryTitle,
          summary: categorySummary,
          description: categoryDescription,
          category: getCategoryDisplayName(category),
          headlines: finalHeadlines
        });
        
        console.log(`✅ Successfully processed category ${category} with ${finalHeadlines.length} headlines`);
      }
      
      // Integrity check: ensure each category has headlines before proceeding
      for (const trend of trends) {
        if (trend.headlines.length === 0) {
          throw new Error(`Category ${trend.id} has no headlines - cannot build newsletter`);
        }
      }
      
      console.log(`✅ All categories have headlines - proceeding with DeepSeek summarization`);
      
      // Generate overall title and subtitle using DeepSeek
      let overallTitle = "";
      let overallSubtitle = "";
      
      try {
        const trendTitles = trends.map(t => t.title).join('\n');
        const overallPrompt = `基于以下三个类别的趋势，生成简体中文整体的标题和副标题：

社会类：${trends.find(t => t.id === 'society')?.title || 'N/A'}
科技类：${trends.find(t => t.id === 'tech')?.title || 'N/A'}
经济类：${trends.find(t => t.id === 'economy')?.title || 'N/A'}

要求：
1. title: 一句话概括今天三大类的共同趋势，20字以内
2. subtitle: 更长的描述，40-60字

请用严格的JSON格式返回：
{
  "title": "整体标题",
  "subtitle": "整体副标题"
}`;

        const overallResult = await openai.chat.completions.create({
          model: "deepseek-chat",
          messages: [{ role: "user", content: overallPrompt }],
          max_tokens: 300,
          temperature: 0.7,
          top_p: 0.9
        });
        
        const overallContent = overallResult.choices[0]?.message?.content;
        if (overallContent) {
          // Clean and parse overall summary
          let cleanContent = overallContent.trim();
          if (cleanContent.startsWith('```json')) {
            cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          }
          if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          try {
            const parsed = JSON.parse(cleanContent);
            overallTitle = parsed.title || "变动中的世界，视角决定答案";
            overallSubtitle = parsed.subtitle || "今日焦点：社会变革、芯片竞赛、全球货币新秩序";
            
            console.log(`✅ Successfully generated overall summary:`, { title: overallTitle, subtitle: overallSubtitle });
          } catch (parseError) {
            console.error("Failed to parse overall summary:", parseError);
            overallTitle = "变动中的世界，视角决定答案";
            overallSubtitle = "今日焦点：社会变革、芯片竞赛、全球货币新秩序";
          }
        }
      } catch (overallError) {
        console.error("Failed to generate overall summary:", overallError);
        overallTitle = "变动中的世界，视角决定答案";
        overallSubtitle = "今日焦点：社会变革、芯片竞赛、全球货币新秩序";
      }
      
      // Build the newsletter
      const newsletter: DailyNewsletter = {
        id: `daily-${cacheKey}`,
        title: overallTitle,
        subtitle: overallSubtitle,
        date: cacheKey,
        trends: trends
      };
      
      // Log headline counts per category before caching
      console.log(`📊 Newsletter built with headlines per category:`);
      trends.forEach(trend => {
        console.log(`  ${trend.category}: ${trend.headlines.length} headlines`);
      });
      
          // Cache the newsletter for current window
    cache[cacheKey] = newsletter;
    console.log("[NEWSLETTER] built & cached", cacheKey);
      

      
      return newsletter;
    }
    
    // Remove the overall route timeout wrapper - rely only on per-source timeouts
    try {
      const result = await buildNewsletter();
      return NextResponse.json(result);
    } catch (error) {
      console.error("Newsletter build failed:", error);
      
      // Return building status instead of fallback data
      return NextResponse.json({
        status: "building",
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
  } catch (error) {
    console.error("Error building newsletter:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to build newsletter",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Fetch headlines from RSS feed
async function fetchRSSHeadlines(source: NewsSource, category: string): Promise<Headline[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    const $ = cheerio.load(xmlText, { xmlMode: true });
    
    const headlines: Headline[] = [];
    const items = $('item').slice(0, 5);
    
    items.each((index, element) => {
      const $item = $(element);
      const title = $item.find('title').text().trim();
      const link = $item.find('link').text().trim();
      const pubDate = $item.find('pubDate').text().trim();
      
      if (title && link) {
        // Handle missing or unparseable pubDate - treat as "now"
        let timestamp = new Date().toISOString();
        if (pubDate) {
          try {
            // Try to parse the pubDate, but don't fail if it's invalid
            const parsedDate = new Date(pubDate);
            if (!isNaN(parsedDate.getTime())) {
              timestamp = parsedDate.toISOString();
            }
            // If parsing fails, timestamp remains as "now"
          } catch (dateError) {
            // Use current time if date parsing fails
            console.warn(`Could not parse pubDate for ${source.name}: ${pubDate}`);
          }
        }
        
        headlines.push({
          id: `${category}-${source.name}-${index}`,
          title,
          source: source.name,
          url: link,
          timestamp
        });
      }
    });
    
    return headlines;
    
  } catch (error) {
    throw new Error(`RSS fetching failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Fetch headlines from HTML using Cheerio
async function fetchHTMLHeadlines(source: NewsSource, category: string): Promise<Headline[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const headlines: Headline[] = [];
    const elements = $(source.selector).slice(0, 5);
    
    elements.each((index, element) => {
      const $el = $(element);
      const title = $el.text().trim();
      let url = $el.attr('href') || '';
      
      // Handle relative URLs
      if (url && !url.startsWith('http')) {
        try {
          const baseUrl = new URL(source.url);
          url = new URL(url, baseUrl).href;
        } catch (urlError) {
          console.warn(`Invalid URL for ${source.name}:`, url);
          url = '';
        }
      }
      
      if (title && url) {
        headlines.push({
          id: `${category}-${source.name}-${index}`,
          title,
          source: source.name,
          url,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return headlines;
    
  } catch (error) {
    throw new Error(`HTML fetching failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Process and deduplicate headlines
function processHeadlines(headlines: Headline[]): Headline[] {
  // Normalize titles for deduplication
  const normalizeTitle = (title: string): string => {
    return title.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, '') // Remove punctuation, keep Chinese characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };
  
  // Group headlines by normalized title
  const headlineGroups = new Map<string, Headline[]>();
  
  headlines.forEach(headline => {
    const normalizedTitle = normalizeTitle(headline.title);
    if (!headlineGroups.has(normalizedTitle)) {
      headlineGroups.set(normalizedTitle, []);
    }
    headlineGroups.get(normalizedTitle)!.push(headline);
  });
  
  // Convert groups to deduplicated headlines
  const deduplicatedHeadlines: Headline[] = Array.from(headlineGroups.entries()).map(([normalizedTitle, group]) => {
    // Use the first headline as the base
    const base = group[0];
    
    // Find the most recent timestamp
    const timestamps = group.map(h => new Date(h.timestamp).getTime());
    const mostRecentTimestamp = new Date(Math.max(...timestamps)).toISOString();
    
    return {
      ...base,
      timestamp: mostRecentTimestamp
    };
  });
  
  // Rank by timestamp (most recent first) and take top 5
  deduplicatedHeadlines.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  return deduplicatedHeadlines.slice(0, 5);
}

// Helper function to get Chinese category names
function getCategoryDisplayName(category: string): string {
  const categoryNames: { [key: string]: string } = {
    society: '社会',
    tech: '科技',
    economy: '经济'
  };
  return categoryNames[category] || category;
}
