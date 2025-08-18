import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getCategoryColor } from "@/utils/categoryColors";

interface Headline {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string;
  timestamp: string;
}

interface HeadlineCardProps {
  headline: Headline;
  summary?: string;
  description?: string;
  isAnalyzingSource?: boolean;
}

export default function HeadlineCard({ headline, summary, description, isAnalyzingSource }: HeadlineCardProps) {
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-[var(--)] leading-tight">
            {headline.title}
          </CardTitle>
          <span className={`px-2 py-1 rounded-full text-xs text-[var(--background)] font-medium ${getCategoryColor(headline.category)}`}>
            {headline.category}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary - Use AI-generated summary if available (40 chars max) */}
        <p className="text-md text-[var(--text)] leading-relaxed">
          {summary ? (summary.length > 40 ? summary.substring(0, 40) + '...' : summary) : headline.title}
        </p>
        
        {/* Description - Use AI-generated description if available */}
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {isAnalyzingSource ? (
            <div className="flex items-center space-x-2 text-[var(--text-secondary)]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--accent)]"></div>
              <span>正在分析新闻内容...</span>
            </div>
          ) : description ? (
            <p>{description}</p>
          ) : (
            <>
              <p>这是一条来自 <strong>{headline.source}</strong> 的新闻，发布于 {new Date(headline.timestamp).toLocaleString()}。</p>
              <p>点击下方按钮可以阅读原文，了解更多详细信息。</p>
            </>
          )}
        </div>
        
        {/* Source with expandable details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--text)]">相关来源：</h4>
          <div className="flex items-center justify-between p-3 bg-[var(--surface-alt)] rounded border border-[var(--border)]">
            <div className="flex-1">
              <h5 className="text-sm font-medium text-[var(--text)] mb-1">
                {headline.source}
              </h5>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {headline.title}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs flex-shrink-0"
              onClick={() => window.open(headline.url, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              阅读原文
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
