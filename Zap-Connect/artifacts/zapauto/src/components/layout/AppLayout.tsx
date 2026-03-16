import React from "react"
import { Link, useLocation } from "wouter"
import { LayoutDashboard, MessageSquare, FileSpreadsheet, Search, History, Settings, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWhatsAppConnection } from "@/hooks/use-zapauto"

interface NavItemProps {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  isActive: boolean
  onClick?: () => void
}

function NavItem({ href, icon: Icon, children, isActive, onClick }: NavItemProps) {
  return (
    <Link href={href} onClick={onClick} className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl mx-2 transition-all duration-200 group",
      isActive 
        ? "bg-primary/10 text-primary font-medium" 
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    )}>
      <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
      {children}
    </Link>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { status } = useWhatsAppConnection()

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/whatsapp", icon: MessageSquare, label: "WhatsApp" },
    { href: "/spreadsheet", icon: FileSpreadsheet, label: "Planilha" },
    { href: "/query", icon: Search, label: "Consulta Manual" },
    { href: "/history", icon: History, label: "Histórico" },
  ]

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-sidebar flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none border-r border-sidebar-accent/50",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-display font-bold text-xl">Z</span>
            </div>
            <span className="text-sidebar-foreground font-display font-bold text-xl tracking-tight">ZapAuto</span>
          </div>
          <button className="lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-4 px-2">Menu Principal</div>
          <nav className="space-y-1 -mx-2">
            {navItems.map((item) => (
              <NavItem 
                key={item.href} 
                href={item.href} 
                icon={item.icon} 
                isActive={location === item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </NavItem>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className={cn(
            "rounded-xl p-4 flex items-center gap-3 border transition-colors",
            status?.connected 
              ? "bg-success/10 border-success/20 text-success-foreground" 
              : "bg-destructive/10 border-destructive/20 text-destructive-foreground"
          )}>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full animate-pulse",
              status?.connected ? "bg-success" : "bg-destructive"
            )} />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">WhatsApp</span>
              <span className="text-xs opacity-80">
                {status?.connected ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-foreground/70 hover:text-foreground" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg lg:text-2xl font-display font-semibold hidden sm:block">
              {navItems.find(i => i.href === location)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium border border-primary/20">
               AD
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
