// This endpoint handles live chat with DeepSeek AI based on current trends and headlines
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Timeout constant for LLM calls
const LLM_TIMEOUT_MS = 20_000; // 10 seconds per LLM call

// Local cache for performance (populated when newsletter is fetched)
let newsletterCache: Record<string, any> = {};

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
  history: any[];
  init?: boolean; // Added for initialization requests
}

interface ChatResponse {
  success: boolean;
  data: {
    answer: string;
    nextQuestions: string[];
  };
}

// Helper function for DeepSeek calls
async function deepseekCall(prompt: string, maxTokens: number = 256) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
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
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("[CHAT] Missing DEEPSEEK_API_KEY");
      return NextResponse.json(
        { error: "DEEPSEEK_API_KEY environment variable not configured" },
        { status: 500 }
      );
    }
    
    // Parse request body
    const body: ChatRequest = await req.json();
    const { topicId, question, history, init } = body;
    
    // Log request details
    console.log("[CHAT] req", body.topicId, body.question, init ? "INIT" : "");
    
    if (!topicId) {
      return NextResponse.json(
        { error: "Missing topicId" },
        { status: 400 }
      );
    }
    
    // Load today's newsletter from the in-memory cache
    const today = new Date().toISOString().slice(0,10);
    let newsletter = newsletterCache[today];
    
    // If newsletter is undefined, try to fetch it from the newsletter API
    if (!newsletter) {
      try {
        console.log("[CHAT] No cached newsletter, fetching from newsletter API...");
        const newsletterResponse = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/newsletter`);
        if (newsletterResponse.ok) {
          newsletter = await newsletterResponse.json();
          // Cache it for future use
          newsletterCache[today] = newsletter;
          console.log("[CHAT] Successfully fetched and cached newsletter data");
        } else {
          console.log("[CHAT] Newsletter API returned error:", newsletterResponse.status);
        }
      } catch (fetchError) {
        console.log("[CHAT] Failed to fetch newsletter:", fetchError);
      }
    }
    
    // If newsletter is still undefined, return "data loading" response
    if (!newsletter) {
      console.log("[CHAT] No newsletter data available yet, returning loading response");
      return NextResponse.json({
        success: true,
        data: {
          answer: "我正在获取今日新闻，请稍后再试。",
          nextQuestions: []
        }
      });
    }
    
    // Find the current trend
    const trend = newsletter.trends.find((t: any) => t.id === topicId);
    
    // If trend not found, return same loading response
    if (!trend) {
      console.log(`[CHAT] Topic not found: ${topicId}, returning loading response`);
      return NextResponse.json({
        success: true,
        data: {
          answer: "我正在阅读今日新闻，请等我一下哦！",
          nextQuestions: []
        }
      });
    }
    
    console.log(`[CHAT] Using real trend data: ${trend.title}`);
    
    // Handle initialization request (empty question)
    if (init && (!question || question.trim() === "")) {
      console.log(`[CHAT] Initialization request for topic: ${topicId}`);
      
      // Build Chinese prompt using real trend data (no fallback text)
      const initPrompt = `你是一位友好且睿智的新闻对话伙伴，具备全球视野和跨领域知识，善于用开放、启发式的方式与用户探讨时事。你帮助用户理解新闻背后的深层逻辑，并激发他们主动思考。
以下是今日主题摘要：
标题: ${trend.title}
摘要: ${trend.summary}
相关新闻:
${trend.headlines.map((h: any) => `• ${h.title}（${h.source}）`).join('\n')}

请基于上述内容提出 3 个开放式、引人深思的问题，分别聚焦：
1. 背景与成因分析
2. 当前影响评估
3. 未来趋势预测

严格返回 JSON:
{
  "answer": "基于当前趋势，我建议从以下几个角度深入探讨：",
  "nextQuestions": ["问题1", "问题2", "问题3"]
}`;

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
      } catch(e) {
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
    
    // Build Chinese prompt using real trend data (no fallback text)
    const prompt = `你是一位友好且睿智的新闻对话伙伴，具备全球视野和跨领域知识。以下是今日主题摘要：
标题: ${trend.title}
摘要: ${trend.summary}
相关新闻:
${trend.headlines.map((h: any) => `• ${h.title}（${h.source}）`).join('\n')}

用户问题:
"${body.question}"

请用中文详细回答用户问题（约150字），并基于上述内容和用户提问，提出2个开放式后续问题，鼓励用户进一步思考和提问。

严格返回 JSON:
{
  "answer": "...",
  "nextQuestions": ["...", "..."]
}`;

    console.log(`[CHAT] Sending prompt to DeepSeek for topic: ${topicId}`);
    
    // Call DeepSeek with timeout and timing
    const startTime = Date.now();
    let raw: string;
    try {
      raw = await Promise.race([
        deepseekCall(prompt, 256),
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
    
    // Parse the response
    let parsed;
    try { 
      parsed = JSON.parse(raw); 
    } catch(e) {
      console.warn("[CHAT] JSON parse fail", raw);
      parsed = {
        answer: "抱歉，AI服务暂时卡住了，请再试一次吧！",
        nextQuestions: []
      };
    }
    
    // Log result and send
    console.log("[CHAT] OK", parsed.nextQuestions);
    return NextResponse.json({ success: true, data: parsed });
    
  } catch (error) {
    console.error(`[CHAT] FAIL - Route error:`, error);
    
    // If DeepSeek call throws (key / quota / network), return fallback
    if (error instanceof Error && (
      error.message.includes("DEEPSEEK_API_KEY") ||
      error.message.includes("TIMEOUT") ||
      error.message.includes("LLM")
    )) {
      console.error("[CHAT] LLM error", error);
      const fallbackResponse = {
        success: true,
        data: {
          answer: "抱歉，AI 服务暂时不可用，请稍后再试。",
          nextQuestions: []
        }
      };
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
