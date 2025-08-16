import { NextRequest, NextResponse } from "next/server";
import { Eko } from "@eko-ai/eko";
import { BrowserAgent } from "@eko-ai/eko-nodejs";

export async function GET(req: NextRequest) {
  try {
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

    // Create Eko instance with BrowserAgent for web scraping
    console.log("Creating Eko instance with BrowserAgent...");
    const eko = new Eko({
      agents: [new BrowserAgent()],
      llms: {
        default: {
          provider: "openai-compatible",
          model: "deepseek-chat",
          apiKey: process.env.DEEPSEEK_API_KEY,
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
    
    console.log("Eko instance created successfully");

    // Step-by-step browser instructions for web scraping
    const prompt = `请按照以下步骤操作：

1. 首先导航到新浪新闻首页：sina.com.cn
2. 等待页面完全加载
3. 提取页面上的主要新闻标题
4. 从这些标题中，为每个类别选择最重要的新闻：
   - 社会类新闻（社会、民生、教育等）
   - 科技类新闻（科技、互联网、AI等）
   - 经济类新闻（财经、股市、房地产等）
5. 返回JSON格式的结果，包含每个新闻的标题和URL

请用严格的JSON格式返回：
{
  "headlines": [
    {
      "category": "society",
      "title": "新闻标题",
      "url": "新闻链接"
    },
    {
      "category": "tech", 
      "title": "新闻标题",
      "url": "新闻链接"
    },
    {
      "category": "economy",
      "title": "新闻标题", 
      "url": "新闻链接"
    }
  ]
}

注意：
- 只返回JSON，不要其他解释
- 确保JSON格式正确
- 每个类别至少返回一条新闻`;

    console.log("Sending prompt to Eko:", prompt);
    console.log("Calling eko.run...");
    
    try {
      // Add timeout wrapper (5 seconds for web scraping)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Eko API timeout after 5 seconds')), 5000);
      });
      
      const ekoPromise = eko.run(prompt);
      const result = await Promise.race([ekoPromise, timeoutPromise]) as any;
      
      console.log("Eko result received:", result);
      console.log("Result type:", typeof result);
      console.log("Result structure:", JSON.stringify(result, null, 2));
      
      // Check if Eko returned an error
      if (result && typeof result === 'object' && result.success === false) {
        console.error("Eko returned error:", result.error);
        console.error("Eko error details:", result.result);
        
        // Return fallback data with error details
        return NextResponse.json({
          success: true,
          data: {
            headlines: [
              {
                category: "society",
                title: "年轻人涌向\"三线城市\"",
                url: "https://example.com/society-news"
              },
              {
                category: "tech",
                title: "国产 3nm AI 芯片面世",
                url: "https://example.com/tech-news"
              },
              {
                category: "economy",
                title: "数字人民币跨境试点扩容",
                url: "https://example.com/economy-news"
              }
            ]
          },
          timestamp: new Date().toISOString(),
          note: `Fallback data due to Eko error: ${result.result || 'Unknown error'}`
        });
      }
      
      // Check if we have content to parse
      if (!result || typeof result !== 'object') {
        console.error("Eko returned invalid result type:", typeof result);
        throw new Error("Eko returned invalid result type");
      }
      
      // Try to get the actual content from the result
      let contentToParse = null;
      
      // Check different possible content fields
      if (result.content) {
        contentToParse = result.content;
        console.log("Found content in result.content:", contentToParse);
      } else if (result.result && typeof result.result === 'string') {
        contentToParse = result.result;
        console.log("Found content in result.result:", contentToParse);
      } else if (result.toString && result.toString() !== '[object Object]') {
        contentToParse = result.toString();
        console.log("Found content in result.toString():", contentToParse);
      } else {
        console.error("No parseable content found in result:", result);
        throw new Error("No parseable content found in Eko result");
      }
      
      // Try to parse the content as JSON
      let parsedResult;
      try {
        // Try to clean the content first
        let cleanContent = contentToParse.trim();
        
        // Remove any markdown formatting that might be present
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        console.log("Cleaned content:", cleanContent);
        
        parsedResult = JSON.parse(cleanContent);
        console.log("Successfully parsed result:", parsedResult);
      } catch (parseError) {
        console.error("Failed to parse content as JSON:", parseError);
        console.log("Raw content:", contentToParse);
        
        // Try to extract JSON from the content if it contains other text
        const jsonMatch = contentToParse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            console.log("Attempting to extract JSON:", jsonMatch[0]);
            parsedResult = JSON.parse(jsonMatch[0]);
            console.log("Successfully extracted and parsed JSON:", parsedResult);
          } catch (extractError) {
            console.error("Failed to extract JSON:", extractError);
          }
        }
        
        if (!parsedResult) {
          // If parsing fails, return fallback data
          console.log("Returning fallback mock data due to parsing error");
          return NextResponse.json({
            success: true,
            data: {
              headlines: [
                {
                  category: "society",
                  title: "年轻人涌向\"三线城市\"",
                  url: "https://example.com/society-news"
                },
                {
                  category: "tech",
                  title: "国产 3nm AI 芯片面世",
                  url: "https://example.com/tech-news"
                },
                {
                  category: "economy",
                  title: "数字人民币跨境试点扩容",
                  url: "https://example.com/economy-news"
                }
              ]
            },
            timestamp: new Date().toISOString(),
            note: `Fallback data due to JSON parsing error. Raw content: ${contentToParse.substring(0, 200)}...`
          });
        }
      }
      
      // Validate the parsed result structure
      if (!parsedResult.headlines || !Array.isArray(parsedResult.headlines)) {
        console.error("Invalid result structure:", parsedResult);
        throw new Error("Eko returned invalid data structure");
      }
      
      return NextResponse.json({
        success: true,
        data: parsedResult,
        timestamp: new Date().toISOString()
      });
      
    } catch (ekoError) {
      console.error("Eko API call failed:", ekoError);
      console.error("Error details:", {
        message: ekoError instanceof Error ? ekoError.message : String(ekoError),
        stack: ekoError instanceof Error ? ekoError.stack : 'No stack trace',
        name: ekoError instanceof Error ? ekoError.name : 'Unknown error type'
      });
      
      // Return fallback data if Eko fails
      console.log("Returning fallback mock data due to Eko error");
      return NextResponse.json({
        success: true,
        data: {
          headlines: [
            {
              category: "society",
              title: "年轻人涌向\"三线城市\"",
              url: "https://example.com/society-news"
            },
            {
              category: "tech",
              title: "国产 3nm AI 芯片面世",
              url: "https://example.com/tech-news"
            },
            {
              category: "economy",
              title: "数字人民币跨境试点扩容",
              url: "https://example.com/economy-news"
            }
          ]
        },
        timestamp: new Date().toISOString(),
        note: `Fallback data due to Eko API error: ${ekoError instanceof Error ? ekoError.message : String(ekoError)}`
      });
    }
  } catch (error) {
    console.error("Error fetching headlines:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch headlines data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
