import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink } from "lucide-react"

interface Source {
  id: string
  name: string
  quote: string
  url: string
}

interface SourceTagProps {
  source: Source
}

export function SourceTag({ source }: SourceTagProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full bg-transparent">
            {source.name}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <p className="mb-2 text-sm">"{source.quote}"</p>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
          >
            Read article <ExternalLink className="h-3 w-3" />
          </a>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
