// This endpoint fetches headlines using ONLY the first verified feed per category
import { NextRequest, NextResponse } from "next/server";
import { NEWS_SOURCES } from "@/config/newsSources";
import { FALLBACK_DATA } from "@/config/fallbackData";
import * as cheerio from 'cheerio';

// In-memory cache for headlines with 1-hour expiration
const cache: { [date: string]: { data: any; timestamp: number; expiresAt: number } } = {};

interface Headline {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string;
  timestamp: string;
}

interface HeadlinesColumn {
  category: string;
  cards: Headline[];
}

interface HeadlinesData {
  date: string;
  columns: HeadlinesColumn[];
}

export async function GET(req: NextRequest) {
  try {
    console.log("[HEADLINES] Request received");
    
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
    
    // Main headlines building function
    async function buildHeadlines() {
      const columns: HeadlinesColumn[] = [];
      
      // Process each category using ONLY the first source
      for (const [category, sources] of Object.entries(NEWS_SOURCES)) {
        if (sources.length === 0) continue;
        
        const source = sources[0]; // Use ONLY first source
        console.log(`[HEADLINES] Processing ${category} from ${source.name}`);
        
        try {
          let headlines: Headline[] = [];
          
          if (source.rss) {
            // Fetch RSS feed
            headlines = await fetchRSSHeadlines(source, category);
            console.log(`[HEADLINES] OK ${category} ${headlines.length} items`);
          } else {
            // Fetch HTML and parse with Cheerio
            headlines = await fetchHTMLHeadlines(source, category);
            console.log(`[HEADLINES] OK ${category} ${headlines.length} items`);
          }
          
          // Process headlines for this category
          const processedHeadlines = processHeadlines(headlines, category);
          
          columns.push({
            category: getCategoryDisplayName(category),
            cards: processedHeadlines.slice(0, 5) // Top 5 per category
          });
          
        } catch (error) {
          console.log(`[HEADLINES] FAIL ${category} ${source.name} fetch:`, error instanceof Error ? error.message : String(error));
          
          // Return single fallback card for this category
          columns.push({
            category: getCategoryDisplayName(category),
            cards: [{
              id: `${category}-fallback`,
              title: `Fallback headline for ${category}`,
              url: `https://example.com/${category}-fallback`,
              source: source.name,
              category: category,
              timestamp: new Date().toISOString()
            }]
          });
        }
      }
      
      return columns;
    }
    
    // Build headlines
    const columns = await buildHeadlines();
    
    // Build response data
    const responseData: HeadlinesData = {
      date: today,
      columns: columns
    };
    
    // Cache the result
    cache[today] = {
      data: responseData,
      timestamp: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
    };
    
    console.log(`[HEADLINES] OK – ${columns.length} categories built`);
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error("[HEADLINES] Route error:", error);
    
    // Return fallback data
    const fallbackData: HeadlinesData = {
      date: new Date().toISOString().slice(0, 10),
      columns: [
        {
          category: "社会",
          cards: [{
            id: "society-fallback",
            title: FALLBACK_DATA.headlines[0].title,
            url: FALLBACK_DATA.headlines[0].url,
            source: "Fallback Data",
            category: "society",
            timestamp: new Date().toISOString()
          }]
        },
        {
          category: "科技", 
          cards: [{
            id: "tech-fallback",
            title: FALLBACK_DATA.headlines[1].title,
            url: FALLBACK_DATA.headlines[1].url,
            source: "Fallback Data",
            category: "tech",
            timestamp: new Date().toISOString()
          }]
        },
        {
          category: "经济",
          cards: [{
            id: "economy-fallback",
            title: FALLBACK_DATA.headlines[2].title,
            url: FALLBACK_DATA.headlines[2].url,
            source: "Fallback Data",
            category: "economy",
            timestamp: new Date().toISOString()
          }]
        }
      ]
    };
    
    return NextResponse.json(fallbackData);
  }
}

// Fetch headlines from RSS feed
async function fetchRSSHeadlines(source: any, category: string): Promise<Headline[]> {
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
    const items = $('item').slice(0, 10); // Take latest 10 items
    
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
            const parsedDate = new Date(pubDate);
            if (!isNaN(parsedDate.getTime())) {
              timestamp = parsedDate.toISOString();
            }
          } catch (dateError) {
            console.warn(`Could not parse pubDate for ${source.name}: ${pubDate}`);
          }
        }
        
        headlines.push({
          id: `${category}-${source.name}-${index}`,
          title,
          source: source.name,
          url: link,
          category,
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
async function fetchHTMLHeadlines(source: any, category: string): Promise<Headline[]> {
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
    const links = $(source.selector || 'a').slice(0, 10); // Take latest 10 items
    
    links.each((index, element) => {
      const $link = $(element);
      const title = $link.text().trim();
      const url = $link.attr('href');
      
      if (title && url) {
        // Convert relative URLs to absolute
        const absoluteUrl = url.startsWith('http') ? url : new URL(url, source.url).href;
        
        headlines.push({
          id: `${category}-${source.name}-${index}`,
          title,
          source: source.name,
          url: absoluteUrl,
          category,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return headlines;
    
  } catch (error) {
    throw new Error(`HTML fetching failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Process headlines: filter by recency, deduplicate, sort by timestamp
function processHeadlines(headlines: Headline[], category: string): Headline[] {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  
  // Filter by recency (keep items published ≤24 hours ago)
  const recentHeadlines = headlines.filter(h => {
    try {
      const pubDate = new Date(h.timestamp);
      return pubDate >= twentyFourHoursAgo;
    } catch {
      return true; // Keep items with unparseable dates
    }
  });
  
  // Deduplicate by normalizing titles
  const seen = new Set<string>();
  const uniqueHeadlines = recentHeadlines.filter(h => {
    const normalized = h.title.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .slice(0, 40); // Take first 40 chars
    
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
  
  // Sort by timestamp descending (most recent first)
  uniqueHeadlines.sort((a, b) => {
    try {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    } catch {
      return 0; // Keep original order if dates can't be parsed
    }
  });
  
  return uniqueHeadlines;
}

// Get display name for category
function getCategoryDisplayName(category: string): string {
  const displayNames: { [key: string]: string } = {
    'society': '社会',
    'tech': '科技',
    'economy': '经济'
  };
  return displayNames[category] || category;
}
