import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getCategoryColor, getCategoryBackgroundColor } from "@/utils/categoryColors";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  description?: string;
  category: string;
  headlines: Headline[];
}

interface TrendCardProps {
  trend: Trend;
  expandedSource: string | null;
  onToggleSource: (sourceId: string) => void;
}

export default function TrendCard({ trend, expandedSource, onToggleSource }: TrendCardProps) {
  return (
    <Card className={`w-full ${getCategoryBackgroundColor(trend.category)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-[var(--text)] leading-tight">
            {trend.title}
          </CardTitle>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(trend.category)}`}>
            {trend.category}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-md text-[var(--text)] leading-relaxed">
          {trend.summary}
        </p>
        
        {/* Expanded Description - Show if available */}
        {trend.description && (
          <div className="">
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  strong: ({node, ...props}) => <strong className="text-[var(--accent)] font-semibold" {...props} />,
                  em: ({node, ...props}) => <em className="text-[var(--text-secondary)]" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[var(--accent)] pl-4 italic text-[var(--text)] my-2" {...props} />,
                  code: ({node, ...props}) => <code className="bg-[var(--accent)] px-1 rounded text-[var(--accent)]" {...props} />,
                }}
              >
                {String(trend.description)}
              </ReactMarkdown>
            </div>
          </div>
        )}
        
        {/* Expandable Sources */}
        {trend.headlines && trend.headlines.length > 0 && (
          <div className="w-full">
            <h4 className="text-sm font-medium text-[var(--text)] mb-3">相关来源：</h4>
            
            {/* Source Buttons - Horizontal Layout */}
            <div className="flex flex-wrap gap-2">
              {trend.headlines.map((headline, index) => (
                <Button
                  key={`${headline.source}-${index}`}
                  variant="outline"
                  size="sm"
                  className={`h-6 px-2 text-xs ${
                    expandedSource === `${headline.source}-${index}` 
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]' 
                      : 'bg-transparent hover:bg-[var(--surface-alt)]'
                  }`}
                  onClick={() => onToggleSource(`${headline.source}-${index}`)}
                >
                  {headline.source}
                </Button>
              ))}
            </div>
            
            {/* Expanded Source Content */}
            {expandedSource && (
              <div className="mt-3 p-3 bg-[var(--surface-alt)] rounded border border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-medium text-[var(--text)]">
                    {trend.headlines.find((h, i) => `${h.source}-${i}` === expandedSource)?.source}
                  </h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs"
                    onClick={() => window.open(trend.headlines.find((h, i) => `${h.source}-${i}` === expandedSource)?.url, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    阅读原文
                  </Button>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {trend.headlines.find((h, i) => `${h.source}-${i}` === expandedSource)?.title}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
