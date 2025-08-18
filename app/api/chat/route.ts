// This endpoint handles live chat with DeepSeek AI based on current trends and headlines
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Timeout constant for LLM calls
const LLM_TIMEOUT_MS = 20_000; // 10 seconds per LLM call

// Local cache for performance (populated when newsletter is fetched)
const newsletterCache: Record<string, DailyNewsletter> = {};

interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
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

interface ChatRequest {
  topicId: string;
  question: string;
  history: ChatMessage[];
  init?: boolean; // Added for initialization requests
  mode?: "trend" | "headline"; // Added to distinguish chat types
}



// Helper function for DeepSeek calls
async function deepseekCall(prompt: string, maxTokens: number = 800) {
      if (!process.env.DEEPSEEK_API) {
      throw new Error("DEEPSEEK_API not configured");
    }

  const openai = new OpenAI({
          apiKey: process.env.DEEPSEEK_API,
    baseURL: "https://api.deepseek.com/v1",
    defaultHeaders: {
      "Content-Type": "application/json",
    },
  });

  const result = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
    top_p: 0.9
  });

  return result.choices[0]?.message?.content || "";
}

export async function POST(req: NextRequest) {
  try {
    console.log("[CHAT] Request received");
    
    // Check if API key is configured
    if (!process.env.DEEPSEEK_API) {
      console.error("[CHAT] Missing DEEPSEEK_API");
      return NextResponse.json(
        { error: "DEEPSEEK_API environment variable not configured" },
        { status: 500 }
      );
    }
    
    // Parse request body
    const body: ChatRequest = await req.json();
    const { topicId, question, init, mode = "trend" } = body;
    
    // Log request details
    console.log("[CHAT] req", body.topicId, body.question, init ? "INIT" : "", "mode:", mode);
    
    if (!topicId) {
      return NextResponse.json(
        { error: "Missing topicId" },
        { status: 400 }
      );
    }
    
    let contextData: any = null;
    let contextType: "trend" | "headline" = "trend";
    
    // Fetch context based on mode
    if (mode === "trend") {
      // For trend chat: fetch newsletter to get trend context
      console.log("[CHAT] Mode: trend - fetching newsletter context");
      
      // Load today's newsletter from the in-memory cache (using AM/PM window)
      const now = new Date();
      const yyyyMMdd = (d: Date) => d.toISOString().slice(0,10);
      const window = now.getHours() < 12 ? "AM" : "PM";
      const cacheKey = `${yyyyMMdd(now)}-${window}`;
      
      let newsletter = newsletterCache[cacheKey];
      
      // If newsletter is undefined, try to fetch it from the newsletter API
      if (!newsletter) {
        try {
          console.log("[CHAT] No cached newsletter, fetching from newsletter API...");
          // Use proper server-side URL construction
          const baseUrl = req.nextUrl.origin || 'http://localhost:3000';
          const newsletterResponse = await fetch(`${baseUrl}/api/newsletter`);
          console.log("[CHAT] Newsletter API response status:", newsletterResponse.status);
          
          if (newsletterResponse.ok) {
            const result = await newsletterResponse.json();
            console.log("[CHAT] Newsletter API response:", {
              hasStatus: !!result.status,
              status: result.status,
              hasTrends: !!result.trends,
              trendsCount: result.trends?.length,
              hasError: !!result.error
            });
            
            // Check if newsletter is still building
            if (result.status === "building") {
              console.log("[CHAT] Newsletter is still building, returning building response");
              return NextResponse.json({
                success: true,
                data: {
                  answer: JSON.stringify({
                    questions: ["数据生成中，请稍候", "请等待新闻内容加载完成", "稍后再试"],
                    summary: "数据生成中，请稍候",
                    description: "新闻内容正在生成中，请稍后再试。"
                  }),
                  nextQuestions: []
                }
              });
            }
            
            // Cache the newsletter for future use
            newsletterCache[cacheKey] = result;
            newsletter = result;
            console.log("[CHAT] Successfully fetched and cached newsletter data");
          } else {
            console.log("[CHAT] Newsletter API returned error:", newsletterResponse.status, newsletterResponse.statusText);
          }
        } catch (fetchError) {
          console.log("[CHAT] Failed to fetch newsletter:", fetchError);
        }
      }
      
      // If newsletter is still undefined, return "data loading" response
      if (!newsletter) {
        console.log("[CHAT] No newsletter data available yet, returning loading response");
        console.log("[CHAT] Newsletter state:", {
          cached: !!newsletterCache[cacheKey],
          cacheKey,
          cacheKeys: Object.keys(newsletterCache)
        });
        return NextResponse.json({
          success: true,
          data: {
            answer: JSON.stringify({
              questions: ["正在获取今日新闻", "请稍后再试", "新闻内容加载中"],
              summary: "正在获取今日新闻，请稍后再试",
              description: "我正在获取今日新闻，请稍后再试。"
            }),
            nextQuestions: []
          }
        });
      }
      
      contextData = newsletter;
      contextType = "trend";
      
    } else if (mode === "headline") {
      // For headline chat: fetch headlines to get headline context
      console.log("[CHAT] Mode: headline - fetching headlines context");
      
      try {
        // Use proper server-side URL construction
        const baseUrl = req.nextUrl.origin || 'http://localhost:3000';
        const headlinesResponse = await fetch(`${baseUrl}/api/headlines`);
        if (headlinesResponse.ok) {
          const headlinesData = await headlinesResponse.json();
          console.log("[CHAT] Headlines API response:", {
            hasColumns: !!headlinesData.columns,
            columnsCount: headlinesData.columns?.length
          });
          
          // Search through all columns for the headline
          let foundHeadline = null;
          for (const column of headlinesData.columns) {
            const found = column.cards.find((card: { id: string; title: string; source: string; url: string; category: string; timestamp: string }) => card.id === topicId);
            if (found) {
              foundHeadline = found;
              console.log(`[CHAT] Found headline: ${foundHeadline.title}`);
              break;
            }
          }
          
          if (foundHeadline) {
            contextData = foundHeadline;
            contextType = "headline";
          } else {
            console.log(`[CHAT] Headline not found: ${topicId}`);
            return NextResponse.json({
              success: true,
              data: {
                answer: "抱歉，这条新闻已过期或不存在，请返回首页重新选择。",
                nextQuestions: []
              }
            });
          }
        } else {
          console.log("[CHAT] Headlines API returned error:", headlinesResponse.status, headlinesResponse.statusText);
        }
      } catch (headlinesError) {
        console.log("[CHAT] Failed to fetch headlines:", headlinesError);
      }
      
      // If headlines fetch failed, return error response
      if (!contextData) {
        console.log("[CHAT] No headlines data available, returning error response");
        return NextResponse.json({
          success: true,
          data: {
            answer: "抱歉，无法加载新闻内容，请稍后再试。",
            nextQuestions: []
          }
        });
      }
    }
    
    // Find the current trend or headline from context data
    let trend = null;
    let headline = null;
    
    if (contextType === "trend") {
      trend = contextData.trends.find((t: Trend) => t.id === topicId);
      if (!trend) {
        console.log(`[CHAT] Topic not found in trends: ${topicId}`);
        return NextResponse.json({
          success: true,
          data: {
            answer: "抱歉，该主题不存在，请返回首页重新选择。",
            nextQuestions: []
          }
        });
      }
    } else if (contextType === "headline") {
      headline = contextData;
    }
    
    // If neither trend nor headline found, return loading response
    if (!trend && !headline) {
      console.log(`[CHAT] Topic not found: ${topicId}, returning loading response`);
      return NextResponse.json({
        success: true,
        data: {
          answer: "我正在阅读今日新闻，请等我一下哦！",
          nextQuestions: []
        }
      });
    }
    
    if (trend) {
      console.log(`[CHAT] Using real trend data: ${trend.title}`);
    } else if (headline) {
      console.log(`[CHAT] Using headline data: ${headline.title}`);
    }
    
    // Handle initialization request (empty question)
    if (init && (!question || question.trim() === "")) {
      console.log(`[CHAT] Initialization request for topic: ${topicId}`);
      
      // Build Chinese prompt using real trend or headline data
      let initPrompt: string;
      if (trend) {
        initPrompt = `你是一位友好且睿智的新闻对话伙伴，具备全球视野和跨领域知识，善于用用轻松自然的语气和用户交流,用开放、启发式的方式与用户探讨时事。你帮助用户理解新闻背后的深层逻辑，激发他们主动思考。
以下是今日主题摘要：
标题: ${trend.title}
摘要: ${trend.summary}
相关新闻:
${trend.headlines.map((h: Headline) => `• ${h.title}（${h.source}）`).join('\n')}

请基于上述内容提出 2 个开放式、引人深思的问题，分别聚焦：
1. 背景与成因分析
2. 当前影响评估

要求：每个问题控制在10-25个字符以内，简洁明了。

严格返回 JSON:
{
  "answer": "基于当前趋势，我建议从以下几个角度深入探讨：",
  "nextQuestions": ["问题1", "问题2"]
}`;
      } else if (headline) {
        initPrompt = `你是一位友好且睿智的新闻对话伙伴，具备全球视野和跨领域知识，善于用开放、启发式的方式与用户探讨时事。你帮助用户理解新闻背后的深层逻辑，并激发他们主动思考。
以下是今日新闻摘要：
标题: ${headline.title}
来源: ${headline.source}
时间: ${new Date(headline.timestamp).toLocaleString()}

请基于上述内容提出 2 个开放式、引人深思的问题，分别聚焦：
1. 背景与成因分析
2. 当前影响评估

要求：每个问题控制在10-25个字符以内，简洁明了。

严格返回 JSON:
{
  "answer": "基于当前新闻，我建议从以下几个角度深入探讨：",
  "nextQuestions": ["问题1", "问题2"]
}`;
      } else {
        // Fallback prompt if neither trend nor headline is found
        initPrompt = `你是一位友好且睿智的新闻对话伙伴。请提出 2 个开放式问题，分别聚焦背景分析和影响评估。每个问题控制在10-25个字符以内。

严格返回 JSON:
{
  "answer": "基于当前话题，我建议从以下几个角度深入探讨：",
  "nextQuestions": ["问题1", "问题2"]
}`;
      }

      console.log(`[CHAT] Sending init prompt to DeepSeek for topic: ${topicId}`);
      
      // Call DeepSeek with timeout and timing
      const startTime = Date.now();
      let raw: string;
      try {
        raw = await Promise.race([
          deepseekCall(initPrompt, 256),
          new Promise<string>((_, r) => setTimeout(() => r("TIMEOUT"), LLM_TIMEOUT_MS))
        ]);
        const duration = Date.now() - startTime;
        console.log(`[CHAT] DeepSeek INIT completed in ${duration}ms`);
      } catch (llmError) {
        const duration = Date.now() - startTime;
        console.log(`[CHAT] DeepSeek INIT failed after ${duration}ms`);
        throw llmError;
      }
      
      if (raw === "TIMEOUT") {
        throw new Error("LLM timeout after 10s");
      }
      
      // Parse the response
      let parsed;
      try { 
        parsed = JSON.parse(raw); 
      } catch {
        console.warn("[CHAT] JSON parse fail (INIT)", raw);
        parsed = {
          answer: "基于当前趋势，我建议从以下几个角度深入探讨：",
          nextQuestions: ["请分析这个趋势的背景和成因", "评估当前的影响范围和程度", "预测未来的发展方向和可能结果"]
        };
      }
      
      // Log result and send
      console.log("[CHAT] OK INIT", parsed.nextQuestions);
      return NextResponse.json({ success: true, data: parsed });
    }
    
    if (!question) {
      return NextResponse.json(
        { error: "Missing question" },
        { status: 400 }
      );
    }
    
    // Build Chinese prompt using real trend or headline data
    let prompt: string;
    
    // Check if this is a structured content generation request
    if (body.question.includes('JSON格式') || body.question.includes('questions') || body.question.includes('summary')) {
      console.log('[CHAT] Detected structured content generation request');
      prompt = body.question; // Use the exact prompt from frontend
    } else if (trend) {
      prompt = `你是一位友好且睿智的新闻对话伙伴，具备全球视野和跨领域知识。喜欢用轻松自然的语气和用户交流，善于用真实案例、比喻和提问激发用户思考。你的目标是让对话像朋友间的讨论一样有温度、有启发性。
以下是今日主题摘要：
标题: ${trend.title}
摘要: ${trend.summary}
相关新闻:
${trend.headlines.map((h: Headline) => `• ${h.title}（${h.source}）`).join('\n')}

用户问题:
"${body.question}"

请用中文详细回答用户问题（约150字）。请用 Markdown 格式输出答案，适当加粗关键词、分段、使用列表、引用、表情符号（如😊、💡、📈）等，让内容更愉快且易读。如需强调风险、建议、结论，可用**加粗**或>引用。

严格返回 JSON:
{
  "answer": "...",
  "nextQuestions": ["问题1", "问题2"]
}`;
    } else if (headline) {
      prompt = `你是一位友好且睿智的新闻对话伙伴，具备全球视野和跨领域知识，喜欢用轻松自然的语气和用户交流，善于用真实案例、比喻和提问激发用户思考。你的目标是让对话像朋友间的讨论一样有温度、有启发性。
。以下是今日新闻摘要：
标题: ${headline.title}
来源: ${headline.source}
时间: ${new Date(headline.timestamp).toLocaleString()}

用户问题:
"${body.question}"

请用中文详细回答用户问题（约150字）。请用 Markdown 格式输出答案，适当加粗关键词、分段、使用列表、引用、表情符号（如😊、💡、📈）等，让内容更易读。如需强调风险、建议、结论，可用**加粗**或>引用。

严格返回 JSON:
{
  "answer": "...",
  "nextQuestions": ["问题1", "问题2"]
}`;
    } else {
      // Fallback prompt if neither trend nor headline is found
      prompt = `你是一位友好且睿智的新闻对话伙伴。请用中文详细回答用户问题（约150字）。

用户问题:
"${body.question}"

请用 Markdown 格式输出答案，适当加粗关键词、分段、使用列表、引用等，让内容更易读。

严格返回 JSON:
{
  "answer": "...",
  "nextQuestions": ["问题1", "问题2"]
}`;
    }

    console.log(`[CHAT] Sending prompt to DeepSeek for topic: ${topicId}`);
    
    // Call DeepSeek with timeout and timing
    const startTime = Date.now();
    let raw: string;
    try {
      raw = await Promise.race([
        deepseekCall(prompt, 800),
        new Promise<string>((_, r) => setTimeout(() => r("TIMEOUT"), LLM_TIMEOUT_MS))
      ]);
      const duration = Date.now() - startTime;
      console.log(`[CHAT] DeepSeek completed in ${duration}ms`);
    } catch (llmError) {
      const duration = Date.now() - startTime;
      console.log(`[CHAT] DeepSeek failed after ${duration}ms`);
      throw llmError;
    }
    
    if (raw === "TIMEOUT") {
      throw new Error("LLM timeout after 10s");
    }
    
    // Log the raw response for debugging
    console.log(`[CHAT] Raw AI response (${raw.length} chars):`, raw.substring(0, 200));
    
    // Parse the response
    let parsed;
    try { 
      parsed = JSON.parse(raw); 
      console.log("[CHAT] Successfully parsed AI response:", parsed);
    } catch(e) {
      console.warn("[CHAT] JSON parse fail for response:", raw);
      console.warn("[CHAT] Parse error:", e);
      parsed = {
        answer: JSON.stringify({
          questions: ["AI服务暂时卡住了", "请再试一次", "服务恢复中"],
          summary: "AI服务暂时卡住了，请再试一次",
          description: "抱歉，AI服务暂时卡住了，请再试一次吧！"
        }),
        nextQuestions: ["请重新尝试", "换个问题问我"]
      };
    }
    
    // For structured content requests, return the parsed content directly
    if (body.question.includes('JSON格式') || body.question.includes('questions') || body.question.includes('summary')) {
      console.log('[CHAT] Returning structured content response');
      return NextResponse.json({ 
        success: true, 
        data: {
          answer: raw, // Return the raw AI response for frontend to parse
          nextQuestions: []
        }
      });
    }
    
    // Generate follow-up questions separately for better performance
    const followUpPrompt = `基于以下对话内容，生成2个开放式后续问题：

用户问题: "${body.question}"
AI回答: "${parsed.answer}"

要求：
1. 每个问题控制在10-25个字符以内
2. 问题要简洁明了，鼓励用户进一步思考
3. 基于AI回答内容，自然延续对话

严格返回 JSON:
{
  "nextQuestions": ["问题1", "问题2"]
}`;

    console.log(`[CHAT] Generating follow-up questions for topic: ${topicId}`);
    
    let followUpQuestions: string[] = [];
    try {
      const followUpRaw = await Promise.race([
        deepseekCall(followUpPrompt, 128),
        new Promise<string>((_, r) => setTimeout(() => r("TIMEOUT"), 5000)) // Shorter timeout for follow-ups
      ]);
      
      if (followUpRaw !== "TIMEOUT") {
        const followUpParsed = JSON.parse(followUpRaw);
        if (followUpParsed.nextQuestions && Array.isArray(followUpParsed.nextQuestions)) {
          followUpQuestions = followUpParsed.nextQuestions;
          console.log("[CHAT] Generated follow-up questions:", followUpQuestions);
        }
      }
    } catch (followUpError) {
      console.warn("[CHAT] Failed to generate follow-up questions:", followUpError);
      // Use default questions if generation fails
      followUpQuestions = ["所以呢？", "还有其他角度和观点吗？"];
    }
    
    // Log result and send
    console.log("[CHAT] OK", followUpQuestions);
    return NextResponse.json({ 
      success: true, 
      data: {
        answer: parsed.answer,
        nextQuestions: followUpQuestions
      }
    });
    
  } catch (error) {
    console.error(`[CHAT] FAIL - Route error:`, error);
    
    // If DeepSeek call throws (key / quota / network), return fallback
    if (error instanceof Error && (
              error.message.includes("DEEPSEEK_API") ||
      error.message.includes("TIMEOUT") ||
      error.message.includes("LLM")
    )) {
      console.error("[CHAT] LLM error", error);
      const fallbackResponse = {
        success: true,
        data: {
          answer: JSON.stringify({
            questions: ["AI服务暂时不可用", "请稍后再试", "服务恢复中"],
            summary: "AI服务暂时不可用，请稍后再试",
            description: "抱歉😞，AI 服务暂时不可用，请稍后再试。"
          }),
          nextQuestions: []
        }
      }
      return NextResponse.json(fallbackResponse);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
