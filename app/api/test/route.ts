import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const envCheck = {
          DEEPSEEK_API: process.env.DEEPSEEK_API ?
      `Set (length: ${process.env.DEEPSEEK_API.length})` :
      "Not set",
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
    
    console.log("Environment check:", envCheck);
    
    return NextResponse.json({
      success: true,
      message: "Test endpoint working",
      env: envCheck
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json({
      success: false,
      error: "Test endpoint failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
