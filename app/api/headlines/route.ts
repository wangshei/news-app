// This endpoint fetches and ranks news headlines for Quick Browse using HTTP+Cheerio by default, with BrowserAgent fallback for JS-heavy sites.
import { NextRequest, NextResponse } from "next/server";
import { Eko } from "@eko-ai/eko";
import { BrowserAgent } from "@eko-ai/eko-nodejs";
import { NEWS_SOURCES } from "@/config/newsSources";
import { FALLBACK_DATA } from "@/config/fallbackData";
import * as cheerio from 'cheerio';

// Timeout constants
const PER_SITE_TIMEOUT_MS = 10_000;   // 10 seconds per site
const ROUTE_TIMEOUT_MS = 12_000;      // 12 seconds total route timeout

// In-memory cache for headlines with 1-hour expiration
const cache: { [date: string]: { data: any; timestamp: number; expiresAt: number } } = {};

interface Headline {
  title: string;
  url: string;
  source: string;
  category: string;
  timestamp: string;
}

interface NormalizedHeadline {
  title: string;
  url: string;
  sources: string[];
  category: string;
  timestamp: string;
  sourceCount: number;
}

export async function GET(req: NextRequest) {
  try {
    console.log(`[HEADLINES] Request received on port ${process.env.PORT || 3000}`);
    console.log("Headlines API route called");
    
    // Check if API key is configured
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY not configured");
      return NextResponse.json(
        { error: "DEEPSEEK_API_KEY environment variable not configured" },
        { status: 500 }
      );
    }
    
    console.log("API key found, length:", process.env.DEEPSEEK_API_KEY.length);

    // Check cache first
    const today = new Date().toISOString().slice(0,10);
    
    // Clear cache if force=true
    if (req.nextUrl.searchParams.get("force")) {
      console.log("Force refresh requested, clearing cache for:", today);
      delete cache[today];
    }
    
    // Try to use cached data if available and not expired
    const cachedData = cache[today];
    if (cachedData && Date.now() < cachedData.expiresAt) {
      console.log("Returning cached headlines for:", today);
      return NextResponse.json(cachedData.data);
    }
    
    console.log("Building fresh headlines for:", today);
    
    // Timeout wrapper for individual source scraping
    async function scrapeWithTimeout(promise: Promise<any>, url: string) {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT " + url)), PER_SITE_TIMEOUT_MS)
        )
      ]);
    }
    
    // Main headlines building function
    async function buildHeadlines() {
      const t0 = Date.now();
      const allHeadlines: Headline[] = [];
      
      // Process each category and its sources
      for (const [category, sources] of Object.entries(NEWS_SOURCES)) {
        console.log(`Processing category: ${category}`);
        
        for (const source of sources) {
          try {
            console.log(`Scraping from ${source.name}: ${source.url}`);
            
            let headlines: Headline[] = [];
            
            // Use Cheerio by default (faster for static HTML)
            if (source.preferCheerio !== false) {
              try {
                console.log(`[Cheerio] Attempting to scrape ${source.name}`);
                headlines = await scrapeWithTimeout(scrapeWithCheerio(source, category), source.url);
                
                if (headlines.length > 0) {
                  console.log(`✅ [Cheerio] Successfully scraped ${headlines.length} headlines from ${source.name}`);
                } else {
                  console.warn(`⚠️ [Cheerio] No headlines found for ${source.name}, falling back to BrowserAgent`);
                  throw new Error("No headlines found with Cheerio");
                }
              } catch (cheerioError) {
                console.warn(`⚠️ [Cheerio] Failed for ${source.name}:`, cheerioError instanceof Error ? cheerioError.message : String(cheerioError));
                throw cheerioError; // Trigger fallback to BrowserAgent
              }
            }
            
            // Use BrowserAgent as fallback or when preferCheerio is false
            if (headlines.length === 0) {
              try {
                console.log(`[BrowserAgent] Attempting to scrape ${source.name}`);
                headlines = await scrapeWithTimeout(scrapeWithBrowserAgent(source, category), source.url);
                
                if (headlines.length > 0) {
                  console.log(`✅ [BrowserAgent] Successfully scraped ${headlines.length} headlines from ${source.name}`);
                } else {
                  console.warn(`⚠️ [BrowserAgent] No headlines found for ${source.name}`);
                }
              } catch (browserError) {
                if (browserError instanceof Error && browserError.message.startsWith("TIMEOUT")) {
                  console.warn(`[HEADLINES] Timeout or error:`, browserError.message);
                } else {
                  console.error(`❌ [BrowserAgent] Failed for ${source.name}:`, browserError instanceof Error ? browserError.message : String(browserError));
                }
                // Continue with other sources
              }
            }
            
            allHeadlines.push(...headlines);
            
          } catch (sourceError) {
            if (sourceError instanceof Error && sourceError.message.startsWith("TIMEOUT")) {
              console.warn(`[HEADLINES] Timeout or error:`, sourceError.message);
            } else {
              console.error(`Failed to scrape ${source.name}:`, sourceError);
            }
            // Continue with other sources
          }
        }
      }
      
      // Process and rank headlines
      const processedHeadlines = processAndRankHeadlines(allHeadlines);
      
      // Build result in expected format: { date, columns[] }
      const result = {
        success: true,
        data: {
          date: today,
          columns: Object.keys(NEWS_SOURCES).map(category => ({
            category,
            headlines: processedHeadlines.filter(h => h.category === category)
          }))
        },
        timestamp: new Date().toISOString()
      };

      console.log(`Total headlines collected: ${allHeadlines.length}`);
      console.log(`Processed headlines: ${processedHeadlines.length}`);
      console.log(`Final result structure:`, result);
      
      // Cache the result for 1 hour
      cache[today] = {
        data: result,
        timestamp: Date.now(),
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
      };
      console.log("Headlines cached for:", today);
      
      // Log successful completion with timing
      console.log(`[HEADLINES] OK – ${result.data.columns.length} categories, ${(Date.now()-t0)}ms`);
      
      return result;
    }
    
        // Overall route timeout wrapper with immediate fallback for testing
    try {
      // For now, return fallback data immediately to test the structure
      console.log(`[HEADLINES] Returning fallback data for testing`);
      
      const fallbackData = {
        success: true,
        data: {
          date: today,
          columns: Object.keys(NEWS_SOURCES).map(category => ({
            category,
            headlines: FALLBACK_DATA.headlines.filter(h => h.category === category)
          }))
        },
        timestamp: new Date().toISOString(),
        note: "Fallback data for testing - scraping disabled temporarily"
      };
      
      return NextResponse.json(fallbackData);
      
      // TODO: Re-enable scraping with proper timeout handling
      // const result = await Promise.race([buildHeadlines(), timeoutError()]);
      // return NextResponse.json(result);
    } catch (error) {
      console.warn(`[HEADLINES] Error:`, error instanceof Error ? error.message : String(error));
      
      // Return fallback data with error note
      const fallbackData = {
        success: true,
        data: {
          date: today,
          columns: Object.keys(NEWS_SOURCES).map(category => ({
            category,
            headlines: FALLBACK_DATA.headlines.filter(h => h.category === category)
          }))
        },
        timestamp: new Date().toISOString(),
        note: `Error occurred: ${error instanceof Error ? error.message : String(error)}`
      };
      
      return NextResponse.json(fallbackData);
    }
    
  } catch (error) {
    console.error("Error fetching headlines:", error);
    
    // Return fallback data with error note
    const fallbackData = {
      success: true,
      data: {
        date: new Date().toISOString().slice(0,10),
        columns: Object.keys(NEWS_SOURCES).map(category => ({
          category,
          headlines: FALLBACK_DATA.headlines.filter(h => h.category === category)
        }))
      },
      timestamp: new Date().toISOString(),
      note: `Fallback data due to error: ${error instanceof Error ? error.message : String(error)}`
    };
    
    return NextResponse.json(fallbackData);
  }
}

// Scrape headlines using HTTP + Cheerio
async function scrapeWithCheerio(source: any, category: string): Promise<Headline[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
      // Note: Timeout is handled by scrapeWithTimeout wrapper
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const headlines: Headline[] = [];
    const elements = $(source.selector);
    
    // Extract up to 3 headlines
    elements.slice(0, 3).each((index, element) => {
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
          title,
          url,
          source: source.name,
          category,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return headlines;
    
  } catch (error) {
    throw new Error(`Cheerio scraping failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Scrape headlines using Eko BrowserAgent (fallback)
async function scrapeWithBrowserAgent(source: any, category: string): Promise<Headline[]> {
  try {
    // Create Eko instance with BrowserAgent for web scraping
    console.log("Creating Eko instance with BrowserAgent...");
    
    // Create BrowserAgent with headless mode enabled
    // Note: Using setHeadless(true) as documented in Eko BrowserAgent API
    const browserAgent = new BrowserAgent();
    browserAgent.setHeadless(true);
    
    const eko = new Eko({
      agents: [browserAgent],
      llms: {
        default: {
          provider: "openai-compatible",
          model: "deepseek-chat",
          apiKey: process.env.DEEPSEEK_API_KEY!,
          config: {
            baseURL: "https://api.deepseek.com/v1",
            timeout: 30000,
            maxRetries: 2,
            maxTokens: 8000,
            temperature: 0.7,
            topP: 0.9
          }
        },
      },
    });
    
    console.log("Eko instance created successfully with headless BrowserAgent");
    
    // Create scraping prompt
    const scrapingPrompt = `请按照以下步骤操作：

1. 导航到网页：${source.url}
2. 等待页面完全加载
3. 使用CSS选择器 "${source.selector}" 提取页面上的前3个主要新闻标题和对应的链接
4. 返回JSON格式的结果

请用严格的JSON格式返回：
{
  "headlines": [
    {
      "title": "新闻标题",
      "url": "新闻链接"
    }
  ]
}

注意：
- 只返回JSON，不要其他解释
- 确保JSON格式正确
- 最多返回3条新闻
- 使用指定的CSS选择器来定位新闻元素`;

    // Note: Timeout is handled by scrapeWithTimeout wrapper
    const scrapingResult = await eko.run(scrapingPrompt);
    console.log(`Source result for ${source.name}:`, scrapingResult);
    
    // Parse scraping result and extract headlines
    let headlines: Headline[] = [];
    
    if (scrapingResult && typeof scrapingResult === 'object') {
      let content = '';
      
      // Try different possible content fields from Eko result
      if ('content' in scrapingResult && typeof scrapingResult.content === 'string') {
        content = scrapingResult.content;
      } else if ('result' in scrapingResult && typeof scrapingResult.result === 'string') {
        content = scrapingResult.result;
      } else {
        content = JSON.stringify(scrapingResult);
      }
      
      // Clean content
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      try {
        const parsed = JSON.parse(content);
        if (parsed.headlines && Array.isArray(parsed.headlines)) {
          headlines = parsed.headlines.slice(0, 3).map((h: any) => ({
            title: h.title,
            url: h.url,
            source: source.name,
            category,
            timestamp: new Date().toISOString()
          }));
        }
      } catch (parseError) {
        console.error(`Failed to parse BrowserAgent result for ${source.name}:`, parseError);
      }
    }
    
    return headlines;
    
  } catch (error) {
    throw new Error(`BrowserAgent scraping failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Process and rank headlines
function processAndRankHeadlines(headlines: Headline[]): NormalizedHeadline[] {
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
  
  // Convert groups to normalized headlines
  const normalizedHeadlines: NormalizedHeadline[] = Array.from(headlineGroups.entries()).map(([normalizedTitle, group]) => {
    // Use the first headline as the base
    const base = group[0];
    
    // Collect all sources and find the most recent timestamp
    const sources = [...new Set(group.map(h => h.source))];
    const timestamps = group.map(h => new Date(h.timestamp).getTime());
    const mostRecentTimestamp = new Date(Math.max(...timestamps)).toISOString();
    
    return {
      title: base.title, // Use original title, not normalized
      url: base.url,
      sources,
      category: base.category,
      timestamp: mostRecentTimestamp,
      sourceCount: sources.length
    };
  });
  
  // Rank by source count (relevancy) then by recency
  normalizedHeadlines.sort((a, b) => {
    if (a.sourceCount !== b.sourceCount) {
      return b.sourceCount - a.sourceCount; // Higher source count first
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // More recent first
  });
  
  // Return top 5 per category
  const categoryLimits = new Map<string, number>();
  const result: NormalizedHeadline[] = [];
  
  normalizedHeadlines.forEach(headline => {
    const currentCount = categoryLimits.get(headline.category) || 0;
    if (currentCount < 5) {
      result.push(headline);
      categoryLimits.set(headline.category, currentCount + 1);
    }
  });
  
  return result;
}
