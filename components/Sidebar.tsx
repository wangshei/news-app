import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"

export default function Sidebar() {
  return (
    <aside className="sidebar-container w-[200px] bg-[var(--surface-secondary)] border-r border-[var(--surface-alt)] flex flex-col">
      {/* Logo */}
              <div className="logo-section p-6 flex items-center gap-2"> 
                <Image src="/logo.svg" alt="logo" width={60} height={60} className="w-15 h-15" />
                <span className="text-xl font-bold text-[var(--accent)] mt-2">小板凳</span>
        </div>

      {/* Navigation Menu */}
      <nav className="navigation-menu flex-1 px-4">
        <div className="space-y-2">
          <div className="menu-item bg-[var(--accent)] text-[var(--surface)] px-4 py-3 rounded-lg font-medium">主页</div>
          <div className="menu-item px-4 py-3 text-[var(--text)] hover:text-[var(--text)] hover:bg-[var(--accent)] hover:bg-opacity-10 rounded-lg cursor-pointer transition-colors">
            我的视角
          </div>
          <div className="menu-item px-4 py-3 text-[var(--text)] hover:text-[var(--text)] hover:bg-[var(--accent)] hover:bg-opacity-10 rounded-lg cursor-pointer transition-colors">
            思考日志
          </div>
        </div>
      </nav>

      {/* User Avatar */}
              <div className="user-section p-6 border-t border-[var(--surface-alt)]">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-[var(--accent)] text-[var(--muted)]">用</AvatarFallback>
            </Avatar>
            <span className="text-sm text-[var(--text)]">用户名</span>
          </div>
        </div>
    </aside>
  )
} 