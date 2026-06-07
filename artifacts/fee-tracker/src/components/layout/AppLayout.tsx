import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/contexts/AutoSaveContext";
import { useSync } from "@/contexts/SyncContext";
import { Link, useLocation } from "wouter";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import {
  LayoutDashboard, Users, CreditCard, PieChart,
  Settings, UserCircle, LogOut, Menu, GraduationCap,
  Wifi, WifiOff, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students",  label: "Students",  icon: Users },
  { href: "/fees",      label: "Fees",      icon: CreditCard },
  { href: "/reports",   label: "Reports",   icon: PieChart },
];

const BOTTOM_ITEMS = [
  { href: "/profile",  label: "Profile",  icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

function ConnectionDot() {
  const { connectionStatus } = useSync();

  const config = {
    connected:      { color: "bg-green-500", title: "Connected to Google Sheets", icon: Wifi },
    disconnected:   { color: "bg-red-500",   title: "Cannot reach Google Sheets", icon: WifiOff },
    checking:       { color: "bg-amber-400", title: "Checking connection…",        icon: Loader2 },
    not_configured: { color: "bg-slate-400", title: "Google Sheets not set up",    icon: WifiOff },
  }[connectionStatus];

  return (
    <span
      title={config.title}
      className={cn("w-2 h-2 rounded-full shrink-0", config.color, connectionStatus === "checking" && "animate-pulse")}
    />
  );
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { teacher, setTeacher } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setTeacher(null);
    setLocation("/login");
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border/60 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <GraduationCap className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm leading-tight text-foreground line-clamp-2 flex-1 min-w-0">
          {teacher?.instituteName ?? "Fee Tracker"}
        </span>
        <ConnectionDot />
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location.startsWith(href);
          return (
            <Link key={href} href={href} onClick={onNavigate}>
              <button
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/60 space-y-0.5 shrink-0">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location.startsWith(href);
          return (
            <Link key={href} href={href} onClick={onNavigate}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { teacher } = useAuth();
  const { saveStatus } = useAutoSave();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  // Don't show layout on auth / setup pages
  if (!teacher || ["/login", "/signup", "/setup"].some(p => location.startsWith(p))) {
    return <>{children}</>;
  }

  const currentPage = [...NAV_ITEMS, ...BOTTOM_ITEMS].find(
    item => location.startsWith(item.href)
  )?.label ?? "Dashboard";

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 lg:w-64 border-r border-border/60 bg-card flex-col shrink-0">
        <NavContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-12 border-b border-border/60 bg-card flex items-center justify-between px-3 sm:px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-1 h-8 w-8">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 max-w-[80vw]">
                <NavContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-sm text-foreground">{currentPage}</span>
          </div>
          <div className="flex items-center gap-2">
            <SaveIndicator status={saveStatus} />
            <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[120px]">
              {teacher.name}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
