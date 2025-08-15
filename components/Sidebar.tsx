import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Sidebar() {
  return (
    <aside className="sidebar-container w-[260px] bg-muted/30 border-r border-border flex flex-col">
      {/* Logo */}
      <div className="logo-section p-6">
        <div className="text-xl font-semibold text-foreground">小板凳</div>
      </div>

      {/* Navigation Menu */}
      <nav className="navigation-menu flex-1 px-4">
        <div className="space-y-2">
          <div className="menu-item bg-accent text-accent-foreground px-4 py-3 rounded-lg font-medium">主页</div>
          <div className="menu-item px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg cursor-pointer transition-colors">
            我的视角
          </div>
          <div className="menu-item px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg cursor-pointer transition-colors">
            思考日志
          </div>
        </div>
      </nav>

      {/* User Avatar */}
      <div className="user-section p-6 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-muted text-muted-foreground">用</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">用户名</span>
        </div>
      </div>
    </aside>
  )
} 