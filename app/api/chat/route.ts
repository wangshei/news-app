import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { topicId, question, history } = await req.json();
    
    console.log("Chat API called with:", { topicId, question, historyLength: history?.length });

    // TODO: replace chat placeholder with real Eko call
    // For now, return a placeholder response
    
    return NextResponse.json({
      success: true,
      data: {
        answer: "(AI 回答占位符…)",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { 
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
