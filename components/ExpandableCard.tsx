import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ExpandableCardProps {
  title: string
  cardContent?: React.ReactNode
}

export default function ExpandableCard({ title, cardContent }: ExpandableCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Card
        className="discovery-card cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-8">
          <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">点击进入</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="discovery-modal w-[calc(100vw-20px)] h-[calc(100vh-120px)] max-w-none max-h-none p-0 mx-auto">
          <DialogHeader className="p-6 border-b">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {cardContent || (
            <div className="flex-1 p-6">
              <div className="h-full bg-muted/50 rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">展开的内容区域</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 