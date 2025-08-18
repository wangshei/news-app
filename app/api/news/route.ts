import { NextResponse } from "next/server";
import OpenAI from "openai";
import { FALLBACK_DATA } from "@/config/fallbackData";

export async function GET() {
  try {
    console.log("API route called");
    
    // Check if API key is configured
      if (!process.env.DEEPSEEK_API) {
    console.error("DEEPSEEK_API not configured");
    return NextResponse.json(
      { error: "DEEPSEEK_API environment variable not configured" },
      { status: 500 }
    );
  }
    
    console.log("API key found, length:", process.env.DEEPSEEK_API.length);

        // For simple text generation, use direct LLM call instead of Eko
    // This avoids the agent system entirely
    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API,
      baseURL: "https://api.deepseek.com/v1",
      defaultHeaders: {
        "Content-Type": "application/json",
      },
    });
    
    console.log("OpenAI instance created successfully");
    
    // Generate news summaries using AI knowledge
    const prompt = `
        你是一名新闻分析员。基于你对当前时事和趋势的了解，为今天生成社会、科技、经济三大类的新闻头条。
        找出“社会”“科技”“经济”三大类的最重要头条各一条。
        对输出做以下要求：
        1. title：一句话概括今天三大类共同的趋势，20字以内
        2. subtitle：更长的描述，40-60字
        3. bullets：数组，每项包含 id, tagline
            • id 必须是 society / tech / economy
            • tagline 为对应类别头条的一句话摘要，25字以内
        4. 用严格的 JSON 返回，不要解释
        `;

    console.log("Sending prompt to OpenAI:", prompt);
    console.log("Calling OpenAI chat completion...");
    
    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI API timeout after 30 seconds')), 30000);
      });
      
      const openaiPromise = openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.7,
        top_p: 0.9
      });
      
      const result = await Promise.race([openaiPromise, timeoutPromise]);
      
      console.log("OpenAI result received:", result);
      console.log("Result type:", typeof result);
      console.log("Result structure:", JSON.stringify(result, null, 2));
      
      // Check if OpenAI returned an error
      if (result && typeof result === 'object' && 'error' in result && result.error && typeof result.error === 'object' && 'message' in result.error) {
        console.error("OpenAI returned error:", result.error);
        
        // Return fallback data with error details
        const fallbackData = FALLBACK_DATA.trends;
        
        return NextResponse.json({
          success: true,
          data: fallbackData,
          timestamp: new Date().toISOString(),
          note: `Fallback data due to OpenAI error: ${result.error.message || 'Unknown error'}`
        });
      }
      
      // Check if we have content to parse
      if (!result || typeof result !== 'object' || !('choices' in result) || !Array.isArray(result.choices) || !result.choices[0] || !('message' in result.choices[0]) || !('content' in result.choices[0].message)) {
        console.error("OpenAI returned invalid result structure:", result);
        throw new Error("OpenAI returned invalid result structure");
      }
      
      // Get the content from OpenAI response
      const contentToParse = result.choices[0].message.content;
      console.log("Found content in OpenAI response:", contentToParse);
      
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
          // If parsing fails, return mock data as fallback
          console.log("Returning fallback mock data due to parsing error");
          const fallbackData = FALLBACK_DATA.trends;
          
          return NextResponse.json({
            success: true,
            data: fallbackData,
            timestamp: new Date().toISOString(),
            note: `Fallback data due to JSON parsing error. Raw content: ${contentToParse.substring(0, 200)}...`
          });
        }
      }
      
      // Validate the parsed result structure
      if (!parsedResult.title || !parsedResult.subtitle || !parsedResult.bullets) {
        console.error("Invalid result structure:", parsedResult);
        throw new Error("Eko returned invalid data structure");
      }
      
      return NextResponse.json({
        success: true,
        data: parsedResult,
        timestamp: new Date().toISOString()
      });
      
    } catch (openaiError) {
      console.error("OpenAI API call failed:", openaiError);
      console.error("Error details:", {
        message: openaiError instanceof Error ? openaiError.message : String(openaiError),
        stack: openaiError instanceof Error ? openaiError.stack : 'No stack trace',
        name: openaiError instanceof Error ? openaiError.name : 'Unknown error type'
      });
      
      // Return fallback data if OpenAI fails
      console.log("Returning fallback mock data due to OpenAI error");
      const fallbackData = FALLBACK_DATA.trends;
        
        return NextResponse.json({
          success: true,
          data: fallbackData,
          timestamp: new Date().toISOString(),
          note: `Fallback data due to OpenAI API error: ${openaiError instanceof Error ? openaiError.message : String(openaiError)}`
        });
      }
  } catch (error) {
    console.error("Error fetching news:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch news data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
