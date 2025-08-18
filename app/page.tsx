"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import HeaderDate from "@/components/HeaderDate"
import KanbanColumn from "@/components/KanbanColumn"
import ExpandableCard from "@/components/ExpandableCard"
import { useNewsletter } from "@/hooks/useNewsletter"
import { useHeadlines } from "@/hooks/useHeadlines"
import { CATEGORIES } from "@/config/categories"

export default function HomePage() {
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")
  const [categories, setCategories] = useState(["科技", "社会", "经济", "政治"])

  
  // Use the centralized newsletter hook
  const { newsletter, loading: newsletterLoading, error: newsletterError, status, cacheKey } = useNewsletter()
  
  // Use the centralized headlines hook
  const { headlines: headlinesData, loading: headlinesLoading, error: headlinesError } = useHeadlines()
  
  // Runtime sanity check
  useEffect(() => {
    if (newsletter?.trends) {
      console.assert(
        newsletter.trends.length === CATEGORIES.length,
        "Newsletter trends mismatch"
      );
    }
  }, [newsletter]);

  const openAddColumnDialog = () => {
    if (categories.length < 6) {
      setNewColumnName("")
      setIsAddColumnModalOpen(true)
    }
  }

  const handleAddCategory = () => {
    if (newColumnName.trim() && categories.length < 6) {
      setCategories([...categories, newColumnName.trim()])
      setIsAddColumnModalOpen(false)
      setNewColumnName("")
    }
  }

  const handleCancelAddCategory = () => {
    setIsAddColumnModalOpen(false)
    setNewColumnName("")
  }

  // Headlines data is now used directly in getNewsItemsForCategory



  // Transform headlines data for Kanban columns
  const getNewsItemsForCategory = (category: string) => {
    if (!headlinesData) return []
    
    // Map Chinese category names to config categories
    const categoryMap: { [key: string]: string } = {
      "科技": "tech",
      "社会": "society", 
      "经济": "economy"
    }
    
    const mappedCategory = categoryMap[category]
    if (!mappedCategory) return []
    
    // Find the column for this category
    const categoryColumn = headlinesData.columns.find(col => col.category === category)
    if (!categoryColumn) return []
    
    // Transform cards to news items
    return categoryColumn.cards.map((card: any, index: number) => ({
      id: card.id || index + 1,
      time: "刚刚",
      title: card.title,
      hasImage: false,
      url: card.url
    }))
  }

  // No more mock data - using real data from useNewsletter hook

  return (
    <div className="flex h-screen w-full max-w-[1512px] mx-auto bg-[var(--surface-third)]">
      <Sidebar />

      {/* Main Content Area - Scrollable */}
      <main className="main-content flex-1 overflow-y-auto">
        <div className="content-wrapper p-8 space-y-8">
          <HeaderDate />

          {/* Section 1: Today's Discovery */}
          <section className="discovery-section">
            <h2 className="text-lg font-medium text-[var(--text)] mb-4">今日发现</h2>
            {newsletterLoading ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                加载中...
              </div>
            ) : status === "building" ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                {cacheKey?.endsWith("AM") ? "早报生成中…" : "晚报生成中…"}
              </div>
            ) : newsletterError ? (
              <div className="text-center py-8 text-red-500">
                加载失败: {newsletterError}
              </div>
            ) : (
              <ExpandableCard title="今日发现" newsletter={newsletter} cacheKey={cacheKey} />
            )}
          </section>



          {/* Section 2: Quick Browse */}
          <section className="browse-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[var(--text)]">快速浏览</h2>
              <Button
                variant="outline"
                size="sm"
                className="add-category-btn w-8 h-8 rounded-full p-0 bg-transparent"
                onClick={openAddColumnDialog}
                disabled={categories.length >= 6}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div
              className={`kanban-grid grid gap-6 ${
                categories.length === 1
                  ? "grid-cols-1"
                  : categories.length === 2
                    ? "grid-cols-2"
                    : categories.length === 3
                      ? "grid-cols-3"
                      : categories.length === 4
                        ? "grid-cols-4"
                        : categories.length === 5
                          ? "grid-cols-5"
                          : "grid-cols-6"
              }`}
            >
              {categories.map((category, index) => (
                <KanbanColumn 
                  key={index} 
                  category={category} 
                  newsItems={headlinesLoading ? [] : getNewsItemsForCategory(category)} 
                />
              ))}
            </div>
          </section>
        </div>
      </main>



      <Dialog open={isAddColumnModalOpen} onOpenChange={setIsAddColumnModalOpen}>
        <DialogContent className="add-column-modal max-w-md">
          <DialogHeader>
            <DialogTitle>添加新类别</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="请输入类别名称"
              value={newColumnName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewColumnName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleAddCategory()
                }
              }}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAddCategory}>
              取消
            </Button>
            <Button onClick={handleAddCategory} disabled={!newColumnName.trim()}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
