import { NextRequest, NextResponse } from "next/server";
import { TrendResponse } from "@/types/trend";

export async function GET(req: NextRequest) {
  // temporary hard-coded sample
  const response: TrendResponse = {
    title: "变动中的世界，视角决定答案",
    subtitle: "今日焦点：社会变革、芯片竞赛、全球货币新秩序",
    bullets: [
      { id: "社会",  tagline: "年轻人涌向\"三线城市\"" },
      { id: "科技",     tagline: "国产 3nm AI 芯片面世" },
      { id: "经济",  tagline: "数字人民币跨境试点扩容" },
    ],
  };
  
  return NextResponse.json(response);
}
