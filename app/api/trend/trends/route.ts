import { NextResponse } from "next/server";
import { TrendResponse } from "@/types/trend";
import { FALLBACK_DATA } from "@/config/fallbackData";

export async function GET() {
  // temporary hard-coded sample
  const response: TrendResponse = FALLBACK_DATA.trends;
  
  return NextResponse.json(response);
}
