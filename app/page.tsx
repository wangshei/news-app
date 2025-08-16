"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import HeaderDate from "@/components/HeaderDate"
import KanbanColumn from "@/components/KanbanColumn"
import ExpandableCard from "@/components/ExpandableCard"

export default function HomePage() {
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")
  const [categories, setCategories] = useState(["科技", "社会", "经济", "政治"])

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

  const mockNewsItems = [
    { id: 1, time: "2小时前", title: "人工智能新突破", hasImage: true },
    { id: 2, time: "2小时前", title: "科技创新发展", hasImage: false },
    { id: 3, time: "4小时前", title: "市场动态分析", hasImage: true },
    { id: 4, time: "6小时前", title: "政策解读报告", hasImage: false },
  ]

  return (
    <div className="flex h-screen w-full max-w-[1512px] mx-auto bg-[var(--surface)]">
      <Sidebar />

      {/* Main Content Area - Scrollable */}
      <main className="main-content flex-1 overflow-y-auto">
        <div className="content-wrapper p-8 space-y-8">
          <HeaderDate />

          {/* Section 1: Today's Discovery */}
          <section className="discovery-section">
            <h2 className="text-lg font-medium text-[var(--text)] mb-4">今日发现</h2>
            <ExpandableCard title="今日发现" />
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
                <KanbanColumn key={index} category={category} newsItems={mockNewsItems} />
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
