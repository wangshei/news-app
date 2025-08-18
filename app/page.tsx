"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { Plus } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import HeaderDate from "@/components/HeaderDate"
import KanbanColumn from "@/components/KanbanColumn"
import ExpandableCard from "@/components/ExpandableCard"
import { useNewsletter } from "@/hooks/useNewsletter"
import { useHeadlines } from "@/hooks/useHeadlines"
import { CATEGORIES } from "@/config/categories"
import { getCategoryColor } from "@/utils/categoryColors"

export default function HomePage() {
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)

  // Default visible list: first three from config
  const defaultThree = CATEGORIES.slice(0,3).map(c=>c.id)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  
  // Use the centralized newsletter hook
  const { newsletter, loading: newsletterLoading, error: newsletterError, status, cacheKey } = useNewsletter()
  
  // Use the centralized headlines hook
  const { headlines: headlinesData, loading: headlinesLoading } = useHeadlines()
  
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
    setIsAddColumnModalOpen(true)
  }

  const handleAddCategory = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      try { localStorage.setItem('kanbanSelected', JSON.stringify(updated)) } catch {}
      console.log(`[KANBAN] user added category ${id}`)
      return updated
    })
    setIsAddColumnModalOpen(false)
  }

  const handleCancelAddCategory = () => {
    setIsAddColumnModalOpen(false)
  }

  // Transform headlines data for Kanban columns
  const getNewsItemsForCategory = (categoryId: string) => {
    if (!headlinesData) return []
    const meta = CATEGORIES.find(c=>c.id===categoryId)
    if (!meta) return []
    // Find the column by display label returned from API
    const categoryColumn = headlinesData.columns.find(col => col.category === meta.label)
    if (!categoryColumn) return []
    
    // Transform cards to news items - preserve original card.id
    return categoryColumn.cards.map((card: { id: string; title: string; url: string }) => ({
      id: card.id, // Use the real headline ID from the API
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
                
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div
              className={`kanban-grid grid gap-6 ${
                ([...defaultThree, ...selectedIds]).length === 1
                  ? "grid-cols-1"
                  : ([...defaultThree, ...selectedIds]).length === 2
                    ? "grid-cols-2"
                    : ([...defaultThree, ...selectedIds]).length === 3
                      ? "grid-cols-3"
                      : ([...defaultThree, ...selectedIds]).length === 4
                        ? "grid-cols-4"
                        : ([...defaultThree, ...selectedIds]).length === 5
                          ? "grid-cols-5"
                          : "grid-cols-6"
              }`}
            >
              {([...defaultThree, ...selectedIds]).map((categoryId, index) => {
                const meta = CATEGORIES.find(c=>c.id===categoryId)
                return (
                  <KanbanColumn 
                    key={`${categoryId}-${index}`} 
                    category={meta ? meta.label : categoryId} 
                    newsItems={headlinesLoading ? [] : getNewsItemsForCategory(categoryId)} 
                  />
                )
              })}
            </div>
          </section>
        </div>
      </main>



      <Dialog open={isAddColumnModalOpen} onOpenChange={setIsAddColumnModalOpen}>
        <DialogContent className="add-column-modal max-w-md">
          <DialogHeader>
            <DialogTitle>添加新类别</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            {CATEGORIES.filter(c => ![...defaultThree, ...selectedIds].includes(c.id)).map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 border border-[var(--border)] rounded">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(c.id)}`}>{c.label}</span>
                  <span className="text-sm text-[var(--text-secondary)]">{c.id}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAddCategory(c.id)}>添加</Button>
              </div>
            ))}
            {CATEGORIES.filter(c => ![...defaultThree, ...selectedIds].includes(c.id)).length === 0 && (
              <div className="text-sm text-[var(--text-secondary)]">暂无可添加的类别</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAddCategory}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
